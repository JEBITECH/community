import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';
import { CreateSponsorshipNeedDto, CreateSponsorshipDto } from './dto/sponsorship.dto';
import { CreatePublicSponsorshipDto } from './dto/create-public-sponsorship.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const FINANCE_MANAGERS = ['super_admin', 'core_committee'];

@Controller('public/sponsorships')
export class PublicSponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  create(@Body() dto: CreatePublicSponsorshipDto) {
    return this.sponsorshipsService.createGuest(dto);
  }
}

@Controller('public/events')
export class PublicSponsorshipNeedsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Get(':id/sponsorship-needs')
  findForEvent(@Param('id') id: string) {
    return this.sponsorshipsService.findNeedsForPublicEvent(id);
  }
}

@Controller('sponsorship-needs')
@UseGuards(RolesGuard)
export class SponsorshipNeedsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  @Roles(...FINANCE_MANAGERS)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSponsorshipNeedDto) {
    return this.sponsorshipsService.createNeed(user, dto);
  }
}

@Controller('events')
@UseGuards(RolesGuard)
export class EventSponsorshipNeedsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Get(':id/sponsorship-needs')
  findForEvent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sponsorshipsService.findNeedsForEvent(id, user);
  }

  @Get(':id/sponsorships')
  @Roles(...FINANCE_MANAGERS)
  findSponsorshipsForEvent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sponsorshipsService.findForEvent(id, user);
  }
}

@Controller('sponsorships')
@UseGuards(RolesGuard)
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSponsorshipDto) {
    return this.sponsorshipsService.create(user, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: RequestUser) {
    return this.sponsorshipsService.findMine(user);
  }

  @Patch(':id/record-payment')
  @Roles(...FINANCE_MANAGERS)
  recordPayment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.sponsorshipsService.recordPayment(id, user, dto);
  }
}
