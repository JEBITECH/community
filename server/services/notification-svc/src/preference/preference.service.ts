import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChannelPreferences,
  NotificationChannel,
} from '@shared/common';
import {
  CompanyNotificationPreferenceEntity,
  RoleNotificationPreferenceEntity,
  UserNotificationPreferenceEntity,
} from '../entities';

export interface EffectivePreferences {
  channels: Record<NotificationChannel, boolean>;
  doNotDisturb: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

const CHANNEL_TO_COMPANY_KEY: Record<
  NotificationChannel,
  keyof CompanyNotificationPreferenceEntity['channels']
> = {
  [NotificationChannel.EMAIL]: 'allowEmail',
  [NotificationChannel.SMS]: 'allowSms',
  [NotificationChannel.PUSH]: 'allowPush',
  [NotificationChannel.WHATSAPP]: 'allowWhatsapp',
  [NotificationChannel.IN_APP]: 'allowInApp',
};

const CHANNEL_TO_USER_KEY: Record<
  NotificationChannel,
  keyof ChannelPreferences
> = {
  [NotificationChannel.EMAIL]: 'email',
  [NotificationChannel.SMS]: 'sms',
  [NotificationChannel.PUSH]: 'push',
  [NotificationChannel.WHATSAPP]: 'whatsapp',
  [NotificationChannel.IN_APP]: 'inApp',
};

const DEFAULT_NOTIFICATION_CHANNEL_PREFERENCES: Record<NotificationChannel, boolean> = {
  [NotificationChannel.EMAIL]: true,
  [NotificationChannel.SMS]: false,
  [NotificationChannel.PUSH]: true,
  [NotificationChannel.WHATSAPP]: false,
  [NotificationChannel.IN_APP]: true,
};

const DEFAULT_ROLE_EVENT_PREFERENCES: Record<string, boolean> = {
  task_created: true,
  task_updated: true,
  task_assigned: true,
  task_inspection_completed: true,
  task_completed: true,
  task_upcoming_24h: true,
  task_upcoming_1h: true,
  task_upcoming_15m: true,
  task_overdue: true,
  reservation_created: true,
  auth_otp: true,
};

const ROLE_EVENT_KEY_ALIASES: Record<string, string[]> = {
  task_created: ['receiveTaskCreationAlerts'],
  task_updated: ['receiveTaskUpdateAlerts'],
  task_assigned: ['receiveTaskAssignmentAlerts'],
  task_inspection_completed: ['receiveInspectionAlerts'],
  task_completed: ['receiveTaskCompletionAlerts'],
  reservation_created: ['receiveReservationAlerts'],
  auth_otp: ['receiveOtpAlerts'],
  marketing_promotion: ['receiveMarketingAlerts'],
};

@Injectable()
export class PreferenceService {
  private readonly logger = new Logger(PreferenceService.name);

  constructor(
    @InjectRepository(UserNotificationPreferenceEntity)
    private readonly userPreferenceRepo: Repository<UserNotificationPreferenceEntity>,
    @InjectRepository(CompanyNotificationPreferenceEntity)
    private readonly companyPreferenceRepo: Repository<CompanyNotificationPreferenceEntity>,
    @InjectRepository(RoleNotificationPreferenceEntity)
    private readonly rolePreferenceRepo: Repository<RoleNotificationPreferenceEntity>,
  ) { }

  async getEffectivePreferences(
    userId: string | undefined,
    organizationId: number | undefined,
    role: string | undefined,
    eventType: string,
  ): Promise<EffectivePreferences> {
    const channels = { ...DEFAULT_NOTIFICATION_CHANNEL_PREFERENCES };

    if (organizationId) {
      const companyPrefs = await this.companyPreferenceRepo.findOne({
        where: { organizationId },
      });

      if (companyPrefs?.channels) {
        for (const channel of Object.values(NotificationChannel)) {
          const companyKey = CHANNEL_TO_COMPANY_KEY[channel];
          const allowed = companyPrefs.channels[companyKey];
          if (allowed === false) {
            channels[channel] = false;
          }
        }
      }
    }

    if (role && organizationId) {
      const rolePrefs = await this.rolePreferenceRepo.findOne({
        where: { role, organizationId },
      });

      const eventPreferences = {
        ...(DEFAULT_ROLE_EVENT_PREFERENCES),
        ...(rolePrefs?.eventPreferences || {}),
      };

      const eventAllowed = this.isEventAllowedForRole(
        eventPreferences,
        eventType,
      );
      if (!eventAllowed) {
        return {
          channels: Object.values(NotificationChannel).reduce(
            (acc, channel) => ({ ...acc, [channel]: false }),
            {} as Record<NotificationChannel, boolean>,
          ),
          doNotDisturb: false,
        };
      }
    }

    let userPrefs: UserNotificationPreferenceEntity | null = null;
    if (userId) {
      userPrefs = await this.userPreferenceRepo.findOne({
        where: { userId, organizationId: organizationId ?? undefined },
      });

      if (userPrefs?.channels) {
        for (const channel of Object.values(NotificationChannel)) {
          const userKey = CHANNEL_TO_USER_KEY[channel];
          const userValue = userPrefs.channels[userKey];
          if (userValue !== undefined) {
            channels[channel] = userValue;
          }
        }
      }
    }

    return {
      channels,
      doNotDisturb: userPrefs?.doNotDisturb ?? false,
      quietHoursStart: userPrefs?.quietHoursStart ?? undefined,
      quietHoursEnd: userPrefs?.quietHoursEnd ?? undefined,
      timezone: userPrefs?.timezone ?? undefined,
    };
  }

  isWithinQuietHours(preferences: EffectivePreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = this.parseTimeToMinutes(preferences.quietHoursStart);
    const end = this.parseTimeToMinutes(preferences.quietHoursEnd);

    if (start <= end) {
      return currentMinutes >= start && currentMinutes < end;
    }

    return currentMinutes >= start || currentMinutes < end;
  }

  async upsertUserPreference(
    data: Partial<UserNotificationPreferenceEntity> & {
      userId: string;
      channels: ChannelPreferences;
    },
  ) {
    const existing = await this.userPreferenceRepo.findOne({
      where: {
        userId: data.userId,
        organizationId: data.organizationId ?? undefined,
      },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.userPreferenceRepo.save(existing);
    }

    return this.userPreferenceRepo.save(
      this.userPreferenceRepo.create(data),
    );
  }

  async upsertCompanyPreference(
    data: Partial<CompanyNotificationPreferenceEntity> & {
      organizationId: number;
    },
  ) {
    const existing = await this.companyPreferenceRepo.findOne({
      where: { organizationId: data.organizationId },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.companyPreferenceRepo.save(existing);
    }

    return this.companyPreferenceRepo.save(
      this.companyPreferenceRepo.create(data),
    );
  }

  async upsertRolePreference(
    data: Partial<RoleNotificationPreferenceEntity> & {
      role: string;
      eventPreferences: Record<string, boolean>;
    },
  ) {
    const existing = await this.rolePreferenceRepo.findOne({
      where: { role: data.role, organizationId: data.organizationId ?? undefined },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.rolePreferenceRepo.save(existing);
    }

    return this.rolePreferenceRepo.save(
      this.rolePreferenceRepo.create(data),
    );
  }

  private isEventAllowedForRole(
    eventPreferences: Record<string, boolean>,
    eventType: string,
  ): boolean {
    for (const eventKey of this.getRoleEventPreferenceKeys(eventType)) {
      if (eventKey in eventPreferences) {
        return eventPreferences[eventKey] !== false;
      }
    }
    return true;
  }

  private getRoleEventPreferenceKeys(eventType: string): string[] {
    const normalized = eventType.trim().toLowerCase().replace(/\./g, '_');
    return [normalized, ...(ROLE_EVENT_KEY_ALIASES[normalized] || [])];
  }

  private parseTimeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
