import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EventDaysService } from './event-days.service';
import { EventComponentsService } from './event-components.service';
import { UpdateEventDayDto } from './dto/event-day.dto';
import { CreateEventComponentDto } from './dto/event-component.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const EVENT_MANAGERS = ['super_admin', 'core_committee'];

@Controller('days')
@UseGuards(RolesGuard)
export class EventDaysController {
  constructor(
    private readonly eventDaysService: EventDaysService,
    private readonly eventComponentsService: EventComponentsService,
  ) {}

  @Patch(':id')
  @Roles(...EVENT_MANAGERS)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateEventDayDto) {
    return this.eventDaysService.update(id, user, dto);
  }

  @Delete(':id')
  @Roles(...EVENT_MANAGERS)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventDaysService.remove(id, user);
  }

  @Post(':dayId/components')
  @Roles(...EVENT_MANAGERS)
  createComponent(
    @CurrentUser() user: RequestUser,
    @Param('dayId') dayId: string,
    @Body() dto: CreateEventComponentDto,
  ) {
    return this.eventComponentsService.create(dayId, user, dto);
  }
}
