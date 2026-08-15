import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventDaysService } from './event-days.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventDayDto } from './dto/event-day.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const EVENT_MANAGERS = ['super_admin', 'core_committee'];

@Controller('events')
@UseGuards(RolesGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventDaysService: EventDaysService,
  ) {}

  @Post()
  @Roles(...EVENT_MANAGERS)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('event_type') event_type?: string,
  ) {
    return this.eventsService.findAll(user, { status, event_type });
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventsService.findOne(id, user);
  }

  @Get(':id/schedule')
  getSchedule(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventsService.getSchedule(id, user);
  }

  @Patch(':id')
  @Roles(...EVENT_MANAGERS)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, user, dto);
  }

  @Post(':id/publish')
  @HttpCode(200)
  @Roles(...EVENT_MANAGERS)
  publish(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventsService.publish(id, user);
  }

  @Delete(':id')
  @Roles(...EVENT_MANAGERS)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventsService.cancel(id, user);
  }

  @Post(':eventId/days')
  @Roles(...EVENT_MANAGERS)
  createDay(
    @CurrentUser() user: RequestUser,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventDayDto,
  ) {
    return this.eventDaysService.create(eventId, user, dto);
  }
}
