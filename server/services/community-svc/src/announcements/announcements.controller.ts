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

import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const ANNOUNCEMENT_ADMINS = ['super_admin', 'core_committee'];

@Controller('announcements')
@UseGuards(RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.announcementsService.findAll(user);
  }

  @Post()
  @Roles(...ANNOUNCEMENT_ADMINS)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(...ANNOUNCEMENT_ADMINS)
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, user, dto);
  }

  @Delete(':id')
  @Roles(...ANNOUNCEMENT_ADMINS)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.announcementsService.remove(id, user);
  }
}
