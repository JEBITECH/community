import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmailChannelModule } from '../channels/email/email-channel.module';
import { QueueService } from './queue.service';

@Module({
  imports: [DatabaseModule, EmailChannelModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
