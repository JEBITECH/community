import { NotificationEntity } from '@shared/entities/src/notification.entity';
import { UserNotificationPreferenceEntity } from '@shared/entities/src/user-notification-preference.entity';
import { CompanyNotificationPreferenceEntity } from '@shared/entities/src/company-notification-preference.entity';
import { RoleNotificationPreferenceEntity } from '@shared/entities/src/role-notification-preference.entity';
import { NotificationTemplateEntity } from '@shared/entities/src/notification-template.entity';
import { NotificationDeliveryLogEntity } from '@shared/entities/src/notification-delivery-log.entity';
import { DeviceTokenEntity } from '@shared/entities/src/device-token.entity';
import { NotificationReminderLogEntity } from '@shared/entities/src/notification-reminder-log.entity';
import { Task } from '@shared/entities/src/task.entity';

export {
  NotificationEntity,
  UserNotificationPreferenceEntity,
  CompanyNotificationPreferenceEntity,
  RoleNotificationPreferenceEntity,
  NotificationTemplateEntity,
  NotificationDeliveryLogEntity,
  DeviceTokenEntity,
  NotificationReminderLogEntity,
  Task,
};

export const NOTIFICATION_ENTITIES = [
  NotificationEntity,
  UserNotificationPreferenceEntity,
  CompanyNotificationPreferenceEntity,
  RoleNotificationPreferenceEntity,
  NotificationTemplateEntity,
  NotificationDeliveryLogEntity,
  DeviceTokenEntity,
  NotificationReminderLogEntity,
  Task,
];
