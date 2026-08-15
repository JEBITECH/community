import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiError } from '@shared/common';
import { EventsService } from './events.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

@Controller('calendar')
@UseGuards(RolesGuard)
export class CalendarController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  find(@CurrentUser() user: RequestUser, @Query('from') from?: string, @Query('to') to?: string) {
    if (!from || !to) {
      throw new ApiError('from and to query params are required', 400, 'VALIDATION_ERROR');
    }
    return this.eventsService.findForCalendar(user, from, to);
  }
}
