import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [DatabaseModule, OrchestratorModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
