import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const COMMENT_MODERATORS = ['super_admin', 'core_committee'];

@Controller('events')
@UseGuards(RolesGuard)
export class EventCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':eventId/comments')
  findForEvent(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string, @Query('event_component_id') componentId?: string) {
    return this.commentsService.findForEvent(eventId, user, componentId);
  }

  @Post(':eventId/comments')
  create(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user, eventId, dto);
  }
}

@Controller('comments')
@UseGuards(RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('me')
  findMine(@CurrentUser() user: RequestUser) {
    return this.commentsService.findMine(user);
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.commentsService.remove(id, user);
  }

  @Post(':id/report')
  report(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.commentsService.report(id, user);
  }

  @Patch(':id/moderate')
  @Roles(...COMMENT_MODERATORS)
  moderate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return this.commentsService.moderate(id, user, dto);
  }
}
