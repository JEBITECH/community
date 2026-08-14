import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { InternalServiceGuard } from '../auth/internal-service.guard';
import {
  UpsertCompanyPreferenceDto,
  UpsertRolePreferenceDto,
  UpsertUserPreferenceDto,
} from '../dto/notification.dto';
import { PreferenceService } from './preference.service';

@Controller('preferences')
@UseGuards(InternalServiceGuard)
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Put('user')
  upsertUserPreference(@Body() dto: UpsertUserPreferenceDto) {
    return this.preferenceService.upsertUserPreference(dto);
  }

  @Put('company')
  upsertCompanyPreference(@Body() dto: UpsertCompanyPreferenceDto) {
    return this.preferenceService.upsertCompanyPreference(dto);
  }

  @Put('role')
  upsertRolePreference(@Body() dto: UpsertRolePreferenceDto) {
    return this.preferenceService.upsertRolePreference(dto);
  }

  @Get('user/:userId')
  getUserEffectivePreferences(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId?: string,
    @Query('eventType') eventType: string = 'generic',
  ) {
    return this.preferenceService.getEffectivePreferences(
      userId,
      organizationId ? Number(organizationId) : undefined,
      undefined,
      eventType,
    );
  }
}
