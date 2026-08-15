import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComment } from './entities/event-comment.entity';
import { CommentsService } from './comments.service';
import { EventCommentsController, CommentsController } from './comments.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, EventComment, Membership, User])],
  controllers: [EventCommentsController, CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
