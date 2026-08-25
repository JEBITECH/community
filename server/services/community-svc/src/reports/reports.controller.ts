import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { toCsv } from '../common/helpers/csv.helper';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const REPORT_VIEWERS = ['super_admin', 'core_committee'];

@Controller('reports')
@UseGuards(RolesGuard)
@Roles(...REPORT_VIEWERS)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private respond(res: Response, rows: Record<string, unknown>[], format: string | undefined, filename: string): void {
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(toCsv(rows));
      return;
    }
    res.json(rows);
  }

  @Get('events')
  async events(@CurrentUser() user: RequestUser, @Query('format') format: string | undefined, @Res() res: Response) {
    const rows = await this.reportsService.eventsReport(user);
    this.respond(res, rows, format, 'events-report');
  }

  @Get('financial')
  async financial(@CurrentUser() user: RequestUser, @Query('format') format: string | undefined, @Res() res: Response) {
    const rows = await this.reportsService.financialReport(user);
    this.respond(res, rows, format, 'financial-report');
  }

  @Get('volunteer')
  async volunteer(@CurrentUser() user: RequestUser, @Query('format') format: string | undefined, @Res() res: Response) {
    const rows = await this.reportsService.volunteerReport(user);
    this.respond(res, rows, format, 'volunteer-report');
  }
}
