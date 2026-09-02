import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership, User } from '@shared/entities';

import { Event } from '../events/entities/event.entity';
import { EventComment } from '../comments/entities/event-comment.entity';
import { EventDiscussionTopic } from './entities/event-discussion-topic.entity';
import { CreateDiscussionTopicDto } from './dto/create-discussion-topic.dto';
import { UpdateDiscussionTopicDto } from './dto/update-discussion-topic.dto';
import { ModerateDiscussionTopicDto } from './dto/moderate-discussion-topic.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';

const ADMIN_ROLES = ['super_admin', 'core_committee', 'master_admin'];

export interface DiscussionTopicWithMeta extends EventDiscussionTopic {
  author_name: string;
  comment_count: number;
}

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly membershipResolver: MembershipResolverService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventDiscussionTopic) private readonly topicRepo: Repository<EventDiscussionTopic>,
    @InjectRepository(EventComment) private readonly commentRepo: Repository<EventComment>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private isAdmin(user: RequestUser): boolean {
    return ADMIN_ROLES.includes(user.role);
  }

  private async loadEvent(eventId: string, user: RequestUser): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);
    return event;
  }

  private assertEventReadable(event: Event, user: RequestUser): void {
    if (!this.isAdmin(user) && event.status !== 'published') {
      throw new ApiError('Event discussions are not available', 404, 'NOT_FOUND');
    }
    if (event.status === 'cancelled') {
      throw new ApiError('Event is cancelled', 409, 'INVALID_STATUS_TRANSITION');
    }
  }

  async create(
    user: RequestUser,
    eventId: string,
    dto: CreateDiscussionTopicDto,
  ): Promise<DiscussionTopicWithMeta> {
    const membership = await this.membershipResolver.resolve(user);
    const event = await this.loadEvent(eventId, user);
    this.assertEventReadable(event, user);

    const heading = dto.heading.trim();
    const body = dto.body?.trim() || null;

    if (!heading) {
      throw new ApiError('Discussion heading is required', 400, 'VALIDATION_ERROR');
    }

    const topic = this.topicRepo.create({
      organization_id: event.organization_id,
      event_id: event.id,
      membership_id: membership.id,
      heading,
      body,
    });

    const saved = await this.topicRepo.save(topic);
    return this.findOne(saved.id, user);
  }

  async findForEvent(eventId: string, user: RequestUser): Promise<DiscussionTopicWithMeta[]> {
    const event = await this.loadEvent(eventId, user);
    this.assertEventReadable(event, user);

    if (!this.isAdmin(user)) {
      await this.membershipResolver.resolve(user);
    }

    const topics = await this.topicRepo.find({
      where: {
        event_id: eventId,
        is_deleted: false,
      },
      order: {
        is_pinned: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (topics.length === 0) {
      return [];
    }

    const topicIds = topics.map((topic) => topic.id);

    const counts = await this.commentRepo
      .createQueryBuilder('comment')
      .select('comment.discussion_topic_id', 'discussion_topic_id')
      .addSelect('COUNT(*)', 'count')
      .where('comment.discussion_topic_id IN (:...topicIds)', { topicIds })
      .andWhere('comment.is_deleted = false')
      .andWhere('comment.moderation_status != :hidden', { hidden: 'hidden' })
      .groupBy('comment.discussion_topic_id')
      .getRawMany<{ discussion_topic_id: string; count: string }>();

    const countByTopic = new Map(
      counts.map((row) => [row.discussion_topic_id, Number(row.count)]),
    );

    const withAuthors = await this.withAuthorNames(topics);

    return withAuthors.map((topic) => ({
      ...topic,
      comment_count: countByTopic.get(topic.id) ?? 0,
    }));
  }

  async findOne(id: string, user: RequestUser): Promise<DiscussionTopicWithMeta> {
    const topic = await this.loadWithContext(id, user);
    const event = await this.loadEvent(topic.event_id, user);
    this.assertEventReadable(event, user);

    if (!this.isAdmin(user)) {
      await this.membershipResolver.resolve(user);
    }

    const [withAuthor] = await this.withAuthorNames([topic]);

    const countQuery = this.commentRepo
      .createQueryBuilder('comment')
      .where('comment.discussion_topic_id = :topicId', { topicId: id })
      .andWhere('comment.is_deleted = false')
      .andWhere('comment.moderation_status != :hidden', { hidden: 'hidden' });

    const commentCount = await countQuery.getCount();

    return {
      ...withAuthor,
      comment_count: commentCount,
    };
  }

  async update(
    id: string,
    user: RequestUser,
    dto: UpdateDiscussionTopicDto,
  ): Promise<DiscussionTopicWithMeta> {
    const membership = await this.membershipResolver.resolve(user);
    const topic = await this.loadWithContext(id, user);
    const isOwner = topic.membership_id === membership.id;
    const isAdmin = this.isAdmin(user);

    if (!isOwner && !isAdmin) {
      throw new ApiError('You can only edit your own discussion', 403, 'FORBIDDEN');
    }

    if (topic.is_closed && !isAdmin) {
      throw new ApiError('This discussion is closed', 409, 'INVALID_STATUS_TRANSITION');
    }

    if (dto.heading !== undefined) {
      const heading = dto.heading.trim();
      if (!heading) {
        throw new ApiError('Discussion heading cannot be empty', 400, 'VALIDATION_ERROR');
      }
      topic.heading = heading;
    }

    if (dto.body !== undefined) {
      topic.body = dto.body?.trim() || null;
    }

    const saved = await this.topicRepo.save(topic);
    return this.findOne(saved.id, user);
  }

  async moderate(
    id: string,
    user: RequestUser,
    dto: ModerateDiscussionTopicDto,
  ): Promise<DiscussionTopicWithMeta> {
    if (!this.isAdmin(user)) {
      throw new ApiError('You do not have permission to moderate discussions', 403, 'FORBIDDEN');
    }

    const topic = await this.loadWithContext(id, user);

    if (dto.is_pinned !== undefined) {
      topic.is_pinned = dto.is_pinned;
    }

    if (dto.is_closed !== undefined) {
      topic.is_closed = dto.is_closed;
    }

    const saved = await this.topicRepo.save(topic);
    return this.findOne(saved.id, user);
  }

  async remove(id: string, user: RequestUser): Promise<EventDiscussionTopic> {
    const membership = await this.membershipResolver.resolve(user);
    const topic = await this.loadWithContext(id, user);
    const isOwner = topic.membership_id === membership.id;
    const isAdmin = this.isAdmin(user);

    if (!isOwner && !isAdmin) {
      throw new ApiError('You can only delete your own discussion', 403, 'FORBIDDEN');
    }

    topic.is_deleted = true;
    topic.is_closed = true;
    return this.topicRepo.save(topic);
  }

  private async loadWithContext(id: string, user: RequestUser): Promise<EventDiscussionTopic> {
    const topic = await this.topicRepo.findOne({ where: { id } });

    if (!topic || topic.is_deleted) {
      throw new ApiError('Discussion not found', 404, 'NOT_FOUND');
    }

    assertTenantMatch(topic.organization_id, user);
    return topic;
  }

  private async withAuthorNames(
    topics: EventDiscussionTopic[],
  ): Promise<(EventDiscussionTopic & { author_name: string })[]> {
    const membershipIds = [...new Set(topics.map((topic) => topic.membership_id))];
    if (membershipIds.length === 0) {
      return [];
    }

    const memberships = await this.membershipRepo.find({ where: { id: In(membershipIds) } });
    const userIds = [...new Set(memberships.map((membership) => membership.user_id))];
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const userById = new Map(users.map((user) => [user.id, user]));

    const nameByMembershipId = new Map(
      memberships.map((membership) => {
        const user = userById.get(membership.user_id);
        return [
          membership.id,
          user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Member',
        ];
      }),
    );

    return topics.map((topic) => ({
      ...topic,
      author_name: nameByMembershipId.get(topic.membership_id) || 'Member',
    }));
  }
}
