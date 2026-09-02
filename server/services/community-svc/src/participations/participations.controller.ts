import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ParticipationsService } from './participations.service';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { CreatePublicParticipationDto } from './dto/create-public-participation.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { RegistrationMethod } from './entities/participation.entity';

const ATTENDANCE_SCANNERS = ['super_admin', 'core_committee'];

/** Guest-facing, unauthenticated write — mounted under /public so the
 * gateway's JwtAuthGuard can allowlist the whole namespace with one entry. */
@Controller('public/participations')
export class PublicParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Post()
  create(@Body() dto: CreatePublicParticipationDto) {
    return this.participationsService.createGuest(dto);
  }
}

@Controller('participations')
@UseGuards(RolesGuard)
export class ParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateParticipationDto) {
    return this.participationsService.create(user, dto);
  }

  @Patch(':id')
  @HttpCode(200)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateParticipationDto) {
    return this.participationsService.update(id, user, dto);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: RequestUser,
    @Query('type') type?: string,
    @Query('registration_method') registrationMethod?: RegistrationMethod,
  ) {
    return this.participationsService.findMine(user, type, registrationMethod);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.participationsService.cancel(id, user);
  }

  @Post('attend')
  @HttpCode(200)
  @Roles(...ATTENDANCE_SCANNERS)
  attend(@CurrentUser() user: RequestUser, @Body('qr_code_token') qrCodeToken: string) {
    return this.participationsService.attend(qrCodeToken, user);
  }
}

@Controller('components')
@UseGuards(RolesGuard)
export class ComponentAvailabilityController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Get(':id/availability')
  availability(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.participationsService.availability(id, user);
  }

  @Get(':id/report')
  @Roles(...ATTENDANCE_SCANNERS)
  report(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.participationsService.componentReport(id, user);
  }
}
