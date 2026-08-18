import { Injectable } from '@nestjs/common';
import { PreferenceService } from '../preference/preference.service';

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

@Injectable()
export class NotificationBootstrapService {
  constructor(private readonly preferenceService: PreferenceService) { }

  private readonly defaultRoleEventPreferences: Record<string, boolean> = {
    reservation_created: true,
    auth_otp: true,
  };

  bootstrapCompanyPreference(data: {
    organizationId: number;
    channels?: CompanyNotificationChannels;
  }) {
    return this.preferenceService.upsertCompanyPreference({
      organizationId: data.organizationId,
      channels: {
        ...DEFAULT_COMPANY_NOTIFICATION_CHANNEL_PREFERENCES,
        ...(data.channels || {}),
      },
    });
  }

  bootstrapRolePreference(data: {
    organizationId: number;
    role: string;
    roleId?: number | null;
    eventPreferences?: Record<string, boolean>;
  }) {
    return this.preferenceService.upsertRolePreference({
      organizationId: data.organizationId,
      role: data.role,
      roleId: data.roleId ?? null,
      eventPreferences: {
        ...(this.defaultRoleEventPreferences),
        ...(data.eventPreferences || {}),
      },
    });
  }

  bootstrapUserPreference(data: {
    organizationId?: number | null;
    userId: string;
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
  }) {
    return this.preferenceService.upsertUserPreference({
      organizationId: data.organizationId ?? undefined,
      userId: data.userId,
      channels: {
        ...DEFAULT_USER_NOTIFICATION_CHANNEL_PREFERENCES,
        ...(data.channels || {}),
      },
      quietHoursStart: data.quietHoursStart ?? null,
      quietHoursEnd: data.quietHoursEnd ?? null,
      timezone: data.timezone ?? null,
      doNotDisturb: data.doNotDisturb ?? false,
    });
  }
}
