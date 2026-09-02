import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventDay } from '../events/entities/event-day.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { EventDiscussionTopic } from '../discussions/entities/event-discussion-topic.entity';
import { EventComment } from './entities/event-comment.entity';
import { CommentsService } from './comments.service';
import { EventCommentsController, CommentsController } from './comments.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, EventDay, EventComponent, EventComment, EventDiscussionTopic, Membership, User])],
  controllers: [EventCommentsController, CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
