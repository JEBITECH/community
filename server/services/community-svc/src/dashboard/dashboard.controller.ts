import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const DASHBOARD_VIEWERS = ['super_admin', 'core_committee'];

@Controller('dashboard')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('org-summary')
  @Roles(...DASHBOARD_VIEWERS)
  orgSummary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.orgSummary(user);
  }

  @Get('events/:id')
  @Roles(...DASHBOARD_VIEWERS)
  eventSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.dashboardService.eventSummary(id, user);
  }

  @Get('platform-summary')
  platformSummary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.platformSummary(user);
  }
}
