import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';

import { Event } from '../events/entities/event.entity';
import { EventComment } from '../comments/entities/event-comment.entity';
import { EventDiscussionTopic } from './entities/event-discussion-topic.entity';
import { DiscussionsService } from './discussions.service';
import { EventDiscussionsController, DiscussionsController } from './discussions.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      Event,
      EventComment,
      EventDiscussionTopic,
      Membership,
      User,
    ]),
  ],
  controllers: [EventDiscussionsController, DiscussionsController],
  providers: [DiscussionsService],
})
export class DiscussionsModule {}
