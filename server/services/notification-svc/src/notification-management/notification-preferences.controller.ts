import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  UpdateDeviceTokenDto,
  UpsertCompanyNotificationPreferenceDto,
  UpsertDeviceTokenDto,
  UpsertRoleNotificationPreferenceDto,
  UpsertUserNotificationPreferenceDto,
} from './dto/notification-preferences.dto';

@ApiBearerAuth()
@ApiTags('Notification Preferences')
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationPreferencesService) {}

  @Get()
  @ApiOperation({ operationId: 'getNotificationPreferences' })
  getPreferences(
    @Query('organization_id') organizationId?: string,
    @Query('user_id') userId?: string,
    @Query('role') role?: string,
  ) {
    return this.service.getPreferences({
      organizationId: organizationId ? Number(organizationId) : undefined,
      userId,
      role,
    });
  }

  @Post('company')
  @ApiOperation({ operationId: 'upsertCompanyNotificationPreference' })
  upsertCompany(@Body() dto: UpsertCompanyNotificationPreferenceDto) {
    return this.service.upsertCompanyPreference(dto);
  }

  @Post('user')
  @ApiOperation({ operationId: 'upsertUserNotificationPreference' })
  upsertUser(@Body() dto: UpsertUserNotificationPreferenceDto) {
    return this.service.upsertUserPreference(dto);
  }

  @Post('role')
  @ApiOperation({ operationId: 'upsertRoleNotificationPreference' })
  upsertRole(@Body() dto: UpsertRoleNotificationPreferenceDto) {
    return this.service.upsertRolePreference(dto);
  }

  @Get('device-tokens')
  @ApiOperation({ operationId: 'getDeviceTokens' })
  getDeviceTokens(
    @Query('organization_id') organizationId?: string,
    @Query('user_id') userId?: string,
  ) {
    return this.service.findDeviceTokens({
      organizationId: organizationId ? Number(organizationId) : undefined,
      userId,
    });
  }

  @Post('device-tokens')
  @ApiOperation({ operationId: 'upsertDeviceToken' })
  upsertDeviceToken(@Body() dto: UpsertDeviceTokenDto) {
    return this.service.upsertDeviceToken(dto);
  }

  @Patch('device-tokens/:id')
  @ApiOperation({ operationId: 'updateDeviceToken' })
  updateDeviceToken(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceTokenDto,
  ) {
    return this.service.updateDeviceToken(Number(id), dto);
  }

  @Get('logs')
  @ApiOperation({ operationId: 'getNotificationLogs' })
  @ApiQuery({ name: 'organization_id', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Fallback page number used when section-specific page params are omitted' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Fallback page size used when section-specific limit params are omitted' })
  @ApiQuery({ name: 'notifications_page', required: false, type: Number })
  @ApiQuery({ name: 'notifications_limit', required: false, type: Number })
  @ApiQuery({ name: 'delivery_page', required: false, type: Number })
  @ApiQuery({ name: 'delivery_limit', required: false, type: Number })
  @ApiQuery({ name: 'reminders_page', required: false, type: Number })
  @ApiQuery({ name: 'reminders_limit', required: false, type: Number })
  getLogs(
    @Query('organization_id') organizationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('notifications_page') notificationsPage?: string,
    @Query('notifications_limit') notificationsLimit?: string,
    @Query('delivery_page') deliveryPage?: string,
    @Query('delivery_limit') deliveryLimit?: string,
    @Query('reminders_page') remindersPage?: string,
    @Query('reminders_limit') remindersLimit?: string,
  ) {
    const parseNumber = (value?: string) => (value === undefined ? undefined : Number(value));

    return this.service.getNotificationLogs({
      organizationId: Number(organizationId),
      page: parseNumber(page),
      limit: parseNumber(limit),
      notifications: {
        page: parseNumber(notificationsPage),
        limit: parseNumber(notificationsLimit),
      },
      delivery: {
        page: parseNumber(deliveryPage),
        limit: parseNumber(deliveryLimit),
      },
      reminders: {
        page: parseNumber(remindersPage),
        limit: parseNumber(remindersLimit),
      },
    });
  }
}
