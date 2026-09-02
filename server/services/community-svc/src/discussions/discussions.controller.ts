import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DiscussionsService } from './discussions.service';
import { CreateDiscussionTopicDto } from './dto/create-discussion-topic.dto';
import { UpdateDiscussionTopicDto } from './dto/update-discussion-topic.dto';
import { ModerateDiscussionTopicDto } from './dto/moderate-discussion-topic.dto';

import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const DISCUSSION_ADMINS = ['super_admin', 'core_committee', 'master_admin'];

@Controller('events')
@UseGuards(RolesGuard)
export class EventDiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get(':eventId/discussions')
  findForEvent(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string) {
    return this.discussionsService.findForEvent(eventId, user);
  }

  @Post(':eventId/discussions')
  create(
    @CurrentUser() user: RequestUser,
    @Param('eventId') eventId: string,
    @Body() dto: CreateDiscussionTopicDto,
  ) {
    return this.discussionsService.create(user, eventId, dto);
  }
}

@Controller('discussions')
@UseGuards(RolesGuard)
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.discussionsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateDiscussionTopicDto,
  ) {
    return this.discussionsService.update(id, user, dto);
  }

  @Patch(':id/moderate')
  @Roles(...DISCUSSION_ADMINS)
  moderate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ModerateDiscussionTopicDto,
  ) {
    return this.discussionsService.moderate(id, user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.discussionsService.remove(id, user);
  }
}
