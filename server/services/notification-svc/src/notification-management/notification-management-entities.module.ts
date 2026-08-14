import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyNotificationPreferenceEntity } from '@shared/entities/src/company-notification-preference.entity';
import { DeviceTokenEntity } from '@shared/entities/src/device-token.entity';
import { RoleNotificationPreferenceEntity } from '@shared/entities/src/role-notification-preference.entity';
import { UserNotificationPreferenceEntity } from '@shared/entities/src/user-notification-preference.entity';
import { NotificationEntity } from '@shared/entities/src/notification.entity';
import { NotificationDeliveryLogEntity } from '@shared/entities/src/notification-delivery-log.entity';
import { NotificationReminderLogEntity } from '@shared/entities/src/notification-reminder-log.entity';
import { NotificationTemplateEntity } from '@shared/entities';
import { User } from '@shared/entities/src/user.entity';
import { Task } from '@shared/entities/src/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyNotificationPreferenceEntity,
      DeviceTokenEntity,
      RoleNotificationPreferenceEntity,
      UserNotificationPreferenceEntity,
      NotificationEntity,
      NotificationDeliveryLogEntity,
      NotificationReminderLogEntity,
      NotificationTemplateEntity,
      User,
      Task,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class NotificationManagementEntitiesModule {}
