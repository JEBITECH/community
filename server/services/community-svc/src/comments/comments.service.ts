import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership, User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventDay } from '../events/entities/event-day.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { EventDiscussionTopic } from '../discussions/entities/event-discussion-topic.entity';
import { EventComment } from './entities/event-comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';

const ADMIN_ROLES = ['super_admin', 'core_committee', 'master_admin'];

export interface EventCommentWithAuthor extends EventComment {
  author_name: string;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly membershipResolver: MembershipResolverService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventDay) private readonly eventDayRepo: Repository<EventDay>,
    @InjectRepository(EventComponent) private readonly eventComponentRepo: Repository<EventComponent>,
    @InjectRepository(EventComment) private readonly commentRepo: Repository<EventComment>,
    @InjectRepository(EventDiscussionTopic) private readonly topicRepo: Repository<EventDiscussionTopic>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(user: RequestUser, eventId: string, dto: CreateCommentDto): Promise<EventComment> {
    const isAdmin = ADMIN_ROLES.includes(user.role);
    const membership = await this.membershipResolver.resolve(user);
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    if (dto.event_component_id && dto.discussion_topic_id) {
      throw new ApiError(
        'A comment cannot target both an event component and a discussion topic',
        400,
        'INVALID_COMMENT_TARGET',
      );
    }

    if (dto.discussion_topic_id) {
      const topic = await this.topicRepo.findOne({
        where: { id: dto.discussion_topic_id },
      });

      if (
        !topic ||
        topic.is_deleted ||
        topic.organization_id !== event.organization_id ||
        topic.event_id !== eventId
      ) {
        throw new ApiError('Discussion not found', 404, 'NOT_FOUND');
      }

      if (!isAdmin && event.status !== 'published') {
        throw new ApiError('Event discussions are not available', 404, 'NOT_FOUND');
      }

      if (topic.is_closed) {
        throw new ApiError(
          'This discussion is closed to new comments',
          409,
          'DISCUSSION_CLOSED',
        );
      }
    }

    if (dto.event_component_id) {
      const component = await this.eventComponentRepo.findOne({
        where: { id: dto.event_component_id },
      });

      if (!component || component.organization_id !== event.organization_id) {
        throw new ApiError('Event component not found', 404, 'NOT_FOUND');
      }

      const day = await this.eventDayRepo.findOne({
        where: { id: component.event_day_id },
      });

      if (!day || day.event_id !== event.id) {
        throw new ApiError('Event component not found', 404, 'NOT_FOUND');
      }
    }

    let parent: EventComment | null = null;
    if (dto.parent_comment_id) {
      parent = await this.commentRepo.findOne({
        where: { id: dto.parent_comment_id },
      });

      if (
        !parent ||
        parent.is_deleted ||
        parent.event_id !== eventId
      ) {
        throw new ApiError('Parent comment not found', 404, 'NOT_FOUND');
      }

      if (parent.parent_comment_id) {
        throw new ApiError(
          'Replies can only be one level deep',
          409,
          'REPLY_DEPTH_EXCEEDED',
        );
      }

      if (parent.discussion_topic_id !== (dto.discussion_topic_id ?? null)) {
        throw new ApiError(
          'Parent comment belongs to a different discussion',
          409,
          'INVALID_COMMENT_TARGET',
        );
      }

      if (parent.event_component_id !== (dto.event_component_id ?? null)) {
        throw new ApiError(
          'Parent comment belongs to a different event component',
          409,
          'INVALID_COMMENT_TARGET',
        );
      }
    }

    const body = dto.body.trim();
    if (!body) {
      throw new ApiError('Comment body is required', 400, 'VALIDATION_ERROR');
    }

    const comment = this.commentRepo.create({
      organization_id: event.organization_id,
      event_id: event.id,
      event_component_id: dto.event_component_id,
      discussion_topic_id: dto.discussion_topic_id,
      membership_id: membership.id,
      parent_comment_id: dto.parent_comment_id,
      body,
      moderation_status: 'visible',
    });

    return this.commentRepo.save(comment);
  }

  async findForEvent(
    eventId: string,
    user: RequestUser,
    componentId?: string,
    discussionTopicId?: string,
  ): Promise<EventCommentWithAuthor[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isAdmin) {
      await this.membershipResolver.resolve(user);
      if (event.status !== 'published') {
        throw new ApiError('Event discussions are not available', 404, 'NOT_FOUND');
      }
    }

    if (componentId && discussionTopicId) {
      throw new ApiError(
        'A comment query cannot target both an event component and a discussion topic',
        400,
        'INVALID_COMMENT_TARGET',
      );
    }

    const qb = this.commentRepo
      .createQueryBuilder('c')
      .where('c.event_id = :eventId', { eventId })
      .andWhere('c.is_deleted = false');

    if (discussionTopicId) {
      const topic = await this.topicRepo.findOne({
        where: { id: discussionTopicId },
      });

      if (
        !topic ||
        topic.is_deleted ||
        topic.organization_id !== event.organization_id ||
        topic.event_id !== eventId
      ) {
        throw new ApiError('Discussion not found', 404, 'NOT_FOUND');
      }

      qb.andWhere('c.discussion_topic_id = :discussionTopicId', {
        discussionTopicId,
      });
    } else if (componentId) {
      const component = await this.eventComponentRepo.findOne({
        where: { id: componentId },
      });

      if (!component || component.organization_id !== event.organization_id) {
        throw new ApiError('Event component not found', 404, 'NOT_FOUND');
      }

      const day = await this.eventDayRepo.findOne({
        where: { id: component.event_day_id },
      });

      if (!day || day.event_id !== event.id) {
        throw new ApiError('Event component not found', 404, 'NOT_FOUND');
      }

      qb.andWhere('c.event_component_id = :componentId', {
        componentId,
      });
    } else {
      qb.andWhere('c.event_component_id IS NULL')
        .andWhere('c.discussion_topic_id IS NULL');
    }

    if (!isAdmin) {
      qb.andWhere('c.moderation_status != :hidden', {
        hidden: 'hidden',
      });
    }

    const comments = await qb
      .orderBy('c.is_pinned', 'DESC')
      .addOrderBy('c.createdAt', 'ASC')
      .getMany();

    return this.withAuthorNames(comments);
  }

  /** Comments only carry membership_id — resolved to a display name in one
   * batched pass rather than per-row joins, since a thread's authors repeat. */
  private async withAuthorNames(comments: EventComment[]): Promise<EventCommentWithAuthor[]> {
    const membershipIds = [...new Set(comments.map((c) => c.membership_id))];
    if (membershipIds.length === 0) return [];

    const memberships = await this.membershipRepo.find({ where: { id: In(membershipIds) } });
    const userIds = [...new Set(memberships.map((m) => m.user_id))];
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const userById = new Map(users.map((u) => [u.id, u]));
    const nameByMembershipId = new Map(
      memberships.map((m) => {
        const u = userById.get(m.user_id);
        return [m.id, u ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Member'];
      }),
    );

    return comments.map((c) => ({ ...c, author_name: nameByMembershipId.get(c.membership_id) || 'Member' }));
  }

  async findMine(user: RequestUser): Promise<(EventComment & { event_id: string; event_name: string })[]> {
    const membership = await this.membershipResolver.resolve(user);
    const { entities, raw } = await this.commentRepo
      .createQueryBuilder('c')
      .innerJoin(Event, 'e', 'e.id = c.event_id')
      .addSelect('e.name AS event_name')
      .where('c.membership_id = :membershipId', { membershipId: membership.id })
      .andWhere('c.is_deleted = false')
      .orderBy('c.createdAt', 'DESC')
      .getRawAndEntities();

    return entities.map((comment, i) => ({ ...comment, event_id: comment.event_id, event_name: raw[i].event_name }));
  }

  private async loadWithContext(id: string, user: RequestUser): Promise<EventComment> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) {
      throw new ApiError('Comment not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(comment.organization_id, user);
    return comment;
  }

  async update(id: string, user: RequestUser, dto: UpdateCommentDto): Promise<EventComment> {
    const membership = await this.membershipResolver.resolve(user);
    const comment = await this.loadWithContext(id, user);
    if (comment.membership_id !== membership.id) {
      throw new ApiError('You can only edit your own comment', 403, 'FORBIDDEN');
    }
    if (comment.is_deleted) {
      throw new ApiError('Cannot edit a deleted comment', 409, 'INVALID_STATUS_TRANSITION');
    }
    comment.body = dto.body;
    return this.commentRepo.save(comment);
  }

  async remove(id: string, user: RequestUser): Promise<EventComment> {
    const membership = await this.membershipResolver.resolve(user);
    const comment = await this.loadWithContext(id, user);
    const isOwner = comment.membership_id === membership.id;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isOwner && !isAdmin) {
      throw new ApiError('You can only delete your own comment', 403, 'FORBIDDEN');
    }
    comment.is_deleted = true;
    return this.commentRepo.save(comment);
  }

  async report(id: string, user: RequestUser): Promise<EventComment> {
    await this.membershipResolver.resolve(user);
    const comment = await this.loadWithContext(id, user);
    if (comment.moderation_status === 'visible') {
      comment.moderation_status = 'reported';
      await this.commentRepo.save(comment);
    }
    return comment;
  }

  async moderate(id: string, user: RequestUser, dto: ModerateCommentDto): Promise<EventComment> {
    const comment = await this.loadWithContext(id, user);
    comment.moderation_status = dto.moderation_status;
    return this.commentRepo.save(comment);
  }
}
