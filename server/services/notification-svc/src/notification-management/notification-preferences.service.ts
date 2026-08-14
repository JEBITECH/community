import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyNotificationPreferenceEntity } from '@shared/entities/src/company-notification-preference.entity';
import { DeviceTokenEntity } from '@shared/entities/src/device-token.entity';
import { RoleNotificationPreferenceEntity } from '@shared/entities/src/role-notification-preference.entity';
import { UserNotificationPreferenceEntity } from '@shared/entities/src/user-notification-preference.entity';
import { NotificationEntity } from '@shared/entities/src/notification.entity';
import { NotificationDeliveryLogEntity } from '@shared/entities/src/notification-delivery-log.entity';
import { NotificationReminderLogEntity } from '@shared/entities/src/notification-reminder-log.entity';
import { User } from '@shared/entities/src/user.entity';
import { Task } from '@shared/entities/src/task.entity';
import { Repository, IsNull, In } from 'typeorm';
import {
  UpdateDeviceTokenDto,
  UpsertCompanyNotificationPreferenceDto,
  UpsertDeviceTokenDto,
  UpsertRoleNotificationPreferenceDto,
  UpsertUserNotificationPreferenceDto,
} from './dto/notification-preferences.dto';

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedSection<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface NotificationRecipientPreview {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface NotificationLogItem {
  id: string;
  eventType: string;
  subject: string | null;
  content: string | null;
  recipientId: string | null;
  channel: string;
  status: string;
  createdAt: Date;
  recipient: NotificationRecipientPreview | null;
}

export interface NotificationDeliveryLogItem {
  id: number;
  provider: string;
  status: string;
  attemptNumber: number;
  failureReason: string | null;
  createdAt: Date;
  notification: {
    eventType: string;
    channel: string;
    recipient: NotificationRecipientPreview | null;
  } | null;
}

export interface NotificationReminderLogItem {
  id: number;
  taskId: number;
  eventType: string;
  recipientId: string;
  sentAt: Date;
  createdAt: Date;
  recipient: NotificationRecipientPreview | null;
  task: {
    title: string;
  } | null;
}

export interface NotificationLogsResponse {
  notifications: PaginatedSection<NotificationLogItem>;
  deliveryLogs: PaginatedSection<NotificationDeliveryLogItem>;
  reminderLogs: PaginatedSection<NotificationReminderLogItem>;
}

export interface NotificationLogPagination {
  page?: number;
  limit?: number;
}

export interface GetNotificationLogsParams {
  organizationId?: number;
  page?: number;
  limit?: number;
  notifications?: NotificationLogPagination;
  delivery?: NotificationLogPagination;
  reminders?: NotificationLogPagination;
}

const DEFAULT_LOG_PAGE = 1;
const DEFAULT_LOG_LIMIT = 10;
const MAX_LOG_LIMIT = 50;

const normalizePositiveInteger = (value: number | undefined, fallback: number) => {
  if (!Number.isFinite(value ?? NaN)) {
    return fallback;
  }

  const normalized = Math.floor(Number(value));
  return normalized > 0 ? normalized : fallback;
};

const normalizeLimit = (value: number | undefined, fallback: number) =>
  Math.min(normalizePositiveInteger(value, fallback), MAX_LOG_LIMIT);

const buildPaginationMeta = (totalItems: number, itemCount: number, currentPage: number, itemsPerPage: number): PaginationMeta => ({
  totalItems,
  itemCount,
  itemsPerPage,
  totalPages: totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0,
  currentPage,
});

const buildPaginatedSection = <T>(data: T[], totalItems: number, currentPage: number, itemsPerPage: number): PaginatedSection<T> => ({
  data,
  meta: buildPaginationMeta(totalItems, data.length, currentPage, itemsPerPage),
});

const mapRecipientPreview = (
  user?: Pick<User, 'firstName' | 'lastName' | 'email'> | null,
): NotificationRecipientPreview | null => {
  if (!user) {
    return null;
  }

  return {
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    email: user.email ?? null,
  };
};

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(UserNotificationPreferenceEntity)
    private readonly userPreferences: Repository<UserNotificationPreferenceEntity>,
    @InjectRepository(CompanyNotificationPreferenceEntity)
    private readonly companyPreferences: Repository<CompanyNotificationPreferenceEntity>,
    @InjectRepository(RoleNotificationPreferenceEntity)
    private readonly rolePreferences: Repository<RoleNotificationPreferenceEntity>,
    @InjectRepository(DeviceTokenEntity)
    private readonly deviceTokens: Repository<DeviceTokenEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationDeliveryLogEntity)
    private readonly deliveryLogsRepo: Repository<NotificationDeliveryLogEntity>,
    @InjectRepository(NotificationReminderLogEntity)
    private readonly reminderLogsRepo: Repository<NotificationReminderLogEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) { }

  async getPreferences(params: {
    organizationId?: number;
    userId?: string;
    role?: string;
  }) {
    if (!params.organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const [company, userPreferences, rolePreferences, deviceTokens] = await Promise.all([
      this.companyPreferences.findOne({
        where: { organizationId: params.organizationId },
      }),
      this.userPreferences.find({
        where: {
          organizationId: params.organizationId,
          ...(params.userId ? { userId: params.userId } : {}),
        },
        relations: { user: true },
        order: { updatedAt: 'DESC' },
      }),
      this.rolePreferences.find({
        where: {
          organizationId: params.organizationId,
          ...(params.role ? { role: params.role } : {}),
        },
        order: { updatedAt: 'DESC' },
      }),
      params.userId
        ? this.deviceTokens.find({
          where: {
            userId: params.userId,
            organizationId: params.organizationId,
          },
          order: { updatedAt: 'DESC' },
        })
        : Promise.resolve([]),
    ]);

    return {
      company,
      user: userPreferences[0] ?? null,
      role: rolePreferences[0] ?? null,
      userPreferences,
      rolePreferences,
      deviceTokens,
    };
  }

  async upsertCompanyPreference(dto: UpsertCompanyNotificationPreferenceDto) {
    await this.companyPreferences.upsert(
      {
        organizationId: dto.organizationId,
        channels: dto.channels,
        settings: (dto.settings as any) || {},
      },
      { conflictPaths: ['organizationId'] },
    );

    return this.companyPreferences.findOneOrFail({
      where: { organizationId: dto.organizationId },
    });
  }

  async upsertUserPreference(dto: UpsertUserNotificationPreferenceDto) {
    await this.userPreferences.upsert(
      {
        userId: dto.userId,
        organizationId: dto.organizationId ?? null,
        channels: dto.channels,
        quietHoursStart: dto.quietHoursStart ?? null,
        quietHoursEnd: dto.quietHoursEnd ?? null,
        timezone: dto.timezone ?? null,
        doNotDisturb: dto.doNotDisturb ?? false,
      },
      { conflictPaths: ['userId', 'organizationId'] },
    );

    return this.userPreferences.findOneOrFail({
      where: {
        userId: dto.userId,
        organizationId: dto.organizationId ?? IsNull(),
      },
    });
  }

  async upsertRolePreference(dto: UpsertRoleNotificationPreferenceDto) {
    await this.rolePreferences.upsert(
      {
        role: dto.role,
        roleId: dto.roleId ?? null,
        organizationId: dto.organizationId ?? null,
        eventPreferences: dto.eventPreferences,
      },
      { conflictPaths: ['role', 'organizationId'] },
    );

    return this.rolePreferences.findOneOrFail({
      where: {
        role: dto.role,
        organizationId: dto.organizationId ?? IsNull(),
      },
    });
  }

  findDeviceTokens(params: { organizationId?: number; userId?: string }) {
    return this.deviceTokens.find({
      where: {
        ...(params.organizationId !== undefined
          ? { organizationId: params.organizationId }
          : {}),
        ...(params.userId ? { userId: params.userId } : {}),
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async upsertDeviceToken(dto: UpsertDeviceTokenDto) {
    await this.deviceTokens.upsert(
      {
        userId: dto.userId,
        organizationId: dto.organizationId ?? null,
        token: dto.token,
        platform: dto.platform,
        isActive: dto.isActive ?? true,
        lastSeenAt: dto.lastSeenAt ? new Date(dto.lastSeenAt) : new Date(),
      },
      { conflictPaths: ['userId', 'token'] },
    );

    return this.deviceTokens.findOneOrFail({
      where: { userId: dto.userId, token: dto.token },
    });
  }

  async updateDeviceToken(id: number, dto: UpdateDeviceTokenDto) {
    const token = await this.deviceTokens.findOne({ where: { id } });
    if (!token) {
      throw new NotFoundException(`Device token ${id} not found`);
    }

    Object.assign(token, {
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.lastSeenAt ? { lastSeenAt: new Date(dto.lastSeenAt) } : {}),
    });

    return this.deviceTokens.save(token);
  }

  async getNotificationLogs(params: GetNotificationLogsParams): Promise<NotificationLogsResponse> {
    if (!params.organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const notificationsPage = normalizePositiveInteger(params.notifications?.page ?? params.page, DEFAULT_LOG_PAGE);
    const notificationsLimit = normalizeLimit(params.notifications?.limit ?? params.limit, DEFAULT_LOG_LIMIT);
    const deliveryPage = normalizePositiveInteger(params.delivery?.page ?? params.page, DEFAULT_LOG_PAGE);
    const deliveryLimit = normalizeLimit(params.delivery?.limit ?? params.limit, DEFAULT_LOG_LIMIT);
    const remindersPage = normalizePositiveInteger(params.reminders?.page ?? params.page, DEFAULT_LOG_PAGE);
    const remindersLimit = normalizeLimit(params.reminders?.limit ?? params.limit, DEFAULT_LOG_LIMIT);

    const [notificationsResult, deliveryResult, tasks] = await Promise.all([
      this.notificationsRepo.findAndCount({
        where: { organizationId: params.organizationId },
        relations: { recipient: true } as any,
        select: {
          id: true,
          eventType: true,
          subject: true,
          content: true,
          recipientId: true,
          channel: true,
          status: true,
          createdAt: true,
          recipient: {
            firstName: true,
            lastName: true,
            email: true,
          },
        } as any,
        order: { createdAt: 'DESC' },
        skip: (notificationsPage - 1) * notificationsLimit,
        take: notificationsLimit,
      }),
      this.deliveryLogsRepo.findAndCount({
        where: { notification: { organizationId: params.organizationId } },
        relations: { notification: { recipient: true } } as any,
        select: {
          id: true,
          provider: true,
          status: true,
          attemptNumber: true,
          failureReason: true,
          createdAt: true,
          notification: {
            eventType: true,
            channel: true,
            recipient: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        } as any,
        order: { createdAt: 'DESC' },
        skip: (deliveryPage - 1) * deliveryLimit,
        take: deliveryLimit,
      }),
      this.taskRepo.find({
        where: { organization_id: params.organizationId },
        select: ['id', 'task_title'],
      }),
    ]);

    const [notifications, notificationsTotal] = notificationsResult;
    const [deliveryLogs, deliveryTotal] = deliveryResult;
    const taskIds = tasks.map((task) => task.id);

    let reminderLogs: NotificationReminderLogItem[] = [];
    let reminderTotal = 0;

    if (taskIds.length > 0) {
      const [logs, total] = await this.reminderLogsRepo.findAndCount({
        where: { taskId: In(taskIds) as any },
        select: ['id', 'taskId', 'eventType', 'recipientId', 'sentAt', 'createdAt'],
        order: { createdAt: 'DESC' },
        skip: (remindersPage - 1) * remindersLimit,
        take: remindersLimit,
      });

      reminderTotal = total;

      if (logs.length > 0) {
        const recipientIds = [...new Set(logs.map((log) => log.recipientId).filter(Boolean))];
        const users = recipientIds.length > 0
          ? await this.userRepo.find({
              where: { id: In(recipientIds) },
              select: ['id', 'firstName', 'lastName', 'email'],
            })
          : [];

        const userMap = new Map(users.map((user) => [user.id, user]));
        const taskMap = new Map(tasks.map((task) => [task.id, task]));

        reminderLogs = logs.map((log) => {
          const user = userMap.get(log.recipientId) || null;
          const task = taskMap.get(log.taskId) || null;

          return {
            id: log.id,
            taskId: log.taskId,
            eventType: log.eventType,
            recipientId: log.recipientId,
            sentAt: log.sentAt,
            createdAt: log.createdAt,
            recipient: mapRecipientPreview(user),
            task: task ? { title: task.task_title } : null,
          };
        });
      }
    }

    const notificationLogs = notifications.map((notification) => ({
      id: notification.id,
      eventType: notification.eventType,
      subject: notification.subject ?? null,
      content: notification.content ?? null,
      recipientId: notification.recipientId ?? null,
      channel: notification.channel,
      status: notification.status,
      createdAt: notification.createdAt,
      recipient: mapRecipientPreview(notification.recipient ?? null),
    }));

    const deliveryLogItems = deliveryLogs.map((log) => ({
      id: log.id,
      provider: log.provider,
      status: log.status,
      attemptNumber: log.attemptNumber,
      failureReason: log.failureReason ?? null,
      createdAt: log.createdAt,
      notification: log.notification ? {
        eventType: log.notification.eventType,
        channel: log.notification.channel,
        recipient: mapRecipientPreview(log.notification.recipient ?? null),
      } : null,
    }));

    return {
      notifications: buildPaginatedSection(notificationLogs, notificationsTotal, notificationsPage, notificationsLimit),
      deliveryLogs: buildPaginatedSection(deliveryLogItems, deliveryTotal, deliveryPage, deliveryLimit),
      reminderLogs: buildPaginatedSection(reminderLogs, reminderTotal, remindersPage, remindersLimit),
    };
  }
}
