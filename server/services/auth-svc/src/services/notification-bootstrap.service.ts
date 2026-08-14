import { NOTIFICATION_EVENTS } from '@shared/common';
import { NotificationClientService } from './notification-client.service';

type CompanyNotificationChannels = {
  allowEmail?: boolean;
  allowSms?: boolean;
  allowPush?: boolean;
  allowWhatsapp?: boolean;
  allowInApp?: boolean;
};

const DEFAULT_COMPANY_NOTIFICATION_CHANNEL_PREFERENCES: CompanyNotificationChannels = {
  allowEmail: true,
  allowSms: true,
  allowPush: true,
  allowWhatsapp: true,
  allowInApp: true,
};

const DEFAULT_USER_NOTIFICATION_CHANNEL_PREFERENCES = {
  email: true,
  sms: false,
  push: true,
  inApp: true,
  whatsapp: false,
};

type BootstrapUserPayload = {
  userId: string;
  organizationId?: number;
  channels?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    whatsapp?: boolean;
  };
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;
  doNotDisturb?: boolean;
};

type BootstrapRolePayload = {
  role: string;
  organizationId: number;
  roleId?: number | null;
  eventPreferences?: Record<string, boolean>;
};

type BootstrapCompanyPayload = {
  organizationId: number;
  channels?: CompanyNotificationChannels;
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
  reservation_created: false,
  auth_otp: true,
};

export class NotificationBootstrapService {
  private readonly notificationClient = new NotificationClientService();

  async bootstrapCompanyPreference(payload: BootstrapCompanyPayload) {
    return this.notificationClient.send(
      NOTIFICATION_EVENTS.BOOTSTRAP_COMPANY_PREFERENCE,
      {
        organizationId: payload.organizationId,
        channels: {
          ...DEFAULT_COMPANY_NOTIFICATION_CHANNEL_PREFERENCES,
          ...(payload.channels || {}),
        },
      },
    );
  }

  async bootstrapRolePreference(payload: BootstrapRolePayload) {
    return this.notificationClient.send(
      NOTIFICATION_EVENTS.BOOTSTRAP_ROLE_PREFERENCE,
      {
        organizationId: payload.organizationId,
        role: payload.role,
        roleId: payload.roleId ?? null,
        eventPreferences: {
          ...(DEFAULT_ROLE_EVENT_PREFERENCES),
          ...(payload.eventPreferences || {}),
        },
      },
    );
  }

  async bootstrapUserPreference(payload: BootstrapUserPayload) {
    return this.notificationClient.send(
      NOTIFICATION_EVENTS.BOOTSTRAP_USER_PREFERENCE,
      {
        userId: payload.userId,
        organizationId: payload.organizationId,
        channels: {
          ...DEFAULT_USER_NOTIFICATION_CHANNEL_PREFERENCES,
          ...(payload.channels || {}),
        },
        quietHoursStart: payload.quietHoursStart ?? null,
        quietHoursEnd: payload.quietHoursEnd ?? null,
        timezone: payload.timezone ?? null,
        doNotDisturb: payload.doNotDisturb ?? false,
      },
    );
  }
}
