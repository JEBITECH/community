import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreatePublicDonationDto } from './dto/create-public-donation.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const FINANCE_MANAGERS = ['super_admin', 'core_committee'];

@Controller('public/donations')
export class PublicDonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  create(@Body() dto: CreatePublicDonationDto) {
    return this.donationsService.createGuest(dto);
  }
}

@Controller('donations')
@UseGuards(RolesGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateDonationDto) {
    return this.donationsService.create(user, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: RequestUser) {
    return this.donationsService.findMine(user);
  }

  @Patch(':id/record-payment')
  @Roles(...FINANCE_MANAGERS)
  recordPayment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.donationsService.recordPayment(id, user, dto);
  }
}

@Controller('events')
@UseGuards(RolesGuard)
export class EventDonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get(':id/donations')
  @Roles(...FINANCE_MANAGERS)
  findForEvent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.donationsService.findForEvent(id, user);
  }
}
