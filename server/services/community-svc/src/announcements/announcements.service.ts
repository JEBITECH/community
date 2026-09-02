import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError, NotificationPriority } from '@shared/common';
import { Membership } from '@shared/entities';

import { Announcement, AnnouncementPriority } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { NotificationClientService } from '../common/services/notification-client.service';

const ANNOUNCEMENT_ADMINS = ['super_admin', 'core_committee'];

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly membershipResolver: MembershipResolverService,
    private readonly notificationClient: NotificationClientService,
    @InjectRepository(Announcement) private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
  ) {}

  private isAdmin(user: RequestUser): boolean {
    return ANNOUNCEMENT_ADMINS.includes(user.role);
  }

  private priorityForNotification(priority: AnnouncementPriority): NotificationPriority {
    switch (priority) {
      case 'urgent':
        return NotificationPriority.CRITICAL;
      case 'important':
        return NotificationPriority.HIGH;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  async create(user: RequestUser, dto: CreateAnnouncementDto): Promise<Announcement> {
    if (!this.isAdmin(user)) {
      throw new ApiError('You do not have permission to create announcements', 403, 'FORBIDDEN');
    }

    const membership = await this.membershipResolver.resolve(user);
    const title = dto.title.trim();
    const body = dto.body.trim();

    if (!title || !body) {
      throw new ApiError('Title and body are required', 400, 'VALIDATION_ERROR');
    }

    const expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new ApiError('expires_at must be in the future', 400, 'INVALID_EXPIRY');
    }

    const announcement = this.announcementRepo.create({
      organization_id: membership.organization_id,
      membership_id: membership.id,
      title,
      body,
      priority: dto.priority ?? 'normal',
      is_pinned: dto.is_pinned ?? false,
      is_deleted: false,
      published_at: new Date(),
      expires_at: expiresAt,
    });

    const saved = await this.announcementRepo.save(announcement);

    const recipients = await this.membershipRepo.find({
      where: {
        organization_id: membership.organization_id,
        status: 'active',
      },
      select: ['user_id'],
    });

    if (recipients.length > 0) {
      this.notificationClient.send({
        eventType: 'community.announcement_published',
        eventId: saved.id,
        entityId: saved.id,
        organizationId: membership.organization_id,
        recipients: recipients.map((recipient) => ({ userId: recipient.user_id })),
        title: saved.title,
        body: saved.body,
        priority: this.priorityForNotification(saved.priority),
        payload: {
          announcementId: saved.id,
          priority: saved.priority,
          expiresAt: saved.expires_at?.toISOString() ?? null,
        },
      });
    }

    return saved;
  }

  async findAll(user: RequestUser): Promise<Announcement[]> {
    const membership = await this.membershipResolver.resolve(user);
    const now = new Date();

    return this.announcementRepo
      .createQueryBuilder('announcement')
      .where('announcement.organization_id = :organizationId', {
        organizationId: membership.organization_id,
      })
      .andWhere('announcement.is_deleted = false')
      .andWhere('announcement.published_at <= :now', { now })
      .andWhere('(announcement.expires_at IS NULL OR announcement.expires_at > :now)', { now })
      .orderBy('announcement.is_pinned', 'DESC')
      .addOrderBy('announcement.published_at', 'DESC')
      .getMany();
  }

  async update(id: string, user: RequestUser, dto: UpdateAnnouncementDto): Promise<Announcement> {
    if (!this.isAdmin(user)) {
      throw new ApiError('You do not have permission to edit announcements', 403, 'FORBIDDEN');
    }

    await this.membershipResolver.resolve(user);
    const announcement = await this.loadWithContext(id, user);

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new ApiError('Title cannot be empty', 400, 'VALIDATION_ERROR');
      }
      announcement.title = title;
    }

    if (dto.body !== undefined) {
      const body = dto.body.trim();
      if (!body) {
        throw new ApiError('Body cannot be empty', 400, 'VALIDATION_ERROR');
      }
      announcement.body = body;
    }

    if (dto.priority !== undefined) {
      announcement.priority = dto.priority;
    }

    if (dto.is_pinned !== undefined) {
      announcement.is_pinned = dto.is_pinned;
    }

    if (dto.expires_at !== undefined) {
      const expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new ApiError('expires_at must be in the future', 400, 'INVALID_EXPIRY');
      }
      announcement.expires_at = expiresAt;
    }

    return this.announcementRepo.save(announcement);
  }

  async remove(id: string, user: RequestUser): Promise<Announcement> {
    if (!this.isAdmin(user)) {
      throw new ApiError('You do not have permission to delete announcements', 403, 'FORBIDDEN');
    }

    await this.membershipResolver.resolve(user);
    const announcement = await this.loadWithContext(id, user);
    announcement.is_deleted = true;
    return this.announcementRepo.save(announcement);
  }

  private async loadWithContext(id: string, user: RequestUser): Promise<Announcement> {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement || announcement.is_deleted) {
      throw new ApiError('Announcement not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(announcement.organization_id, user);
    return announcement;
  }
}
