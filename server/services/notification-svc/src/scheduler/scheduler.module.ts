import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@shared/entities/src/task.entity';
import { NotificationReminderLogEntity } from '@shared/entities/src/notification-reminder-log.entity';
import { CompanyNotificationPreferenceEntity } from '@shared/entities/src/company-notification-preference.entity';
import { User } from '@shared/entities/src/user.entity';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { ReminderSchedulerService } from './reminder-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      NotificationReminderLogEntity,
      CompanyNotificationPreferenceEntity,
      User,
    ]),
    OrchestratorModule,
  ],
  providers: [ReminderSchedulerService],
  exports: [ReminderSchedulerService],
})
export class SchedulerModule {}
