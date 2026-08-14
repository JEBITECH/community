import { Module } from '@nestjs/common';
import { NotificationManagementEntitiesModule } from './notification-management-entities.module';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationTemplatesController } from './notification-templates.controller';
import { NotificationTemplatesService } from './notification-templates.service';

@Module({
  imports: [NotificationManagementEntitiesModule],
  controllers: [NotificationPreferencesController, NotificationTemplatesController],
  providers: [NotificationPreferencesService, NotificationTemplatesService],
})
export class NotificationManagementModule {}
