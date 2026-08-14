import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalServiceGuard } from '../auth/internal-service.guard';
import { NotificationBootstrapService } from './bootstrap.service';
import {
  BootstrapCompanyPreferenceDto,
  BootstrapRolePreferenceDto,
  BootstrapUserPreferenceDto,
} from '../dto/notification.dto';

@Controller('bootstrap')
@UseGuards(InternalServiceGuard)
export class BootstrapController {
  constructor(private readonly bootstrapService: NotificationBootstrapService) {}

  @Post('company')
  bootstrapCompany(@Body() dto: BootstrapCompanyPreferenceDto) {
    return this.bootstrapService.bootstrapCompanyPreference(dto);
  }

  @Post('role')
  bootstrapRole(@Body() dto: BootstrapRolePreferenceDto) {
    return this.bootstrapService.bootstrapRolePreference(dto);
  }

  @Post('user')
  bootstrapUser(@Body() dto: BootstrapUserPreferenceDto) {
    return this.bootstrapService.bootstrapUserPreference(dto);
  }
}
