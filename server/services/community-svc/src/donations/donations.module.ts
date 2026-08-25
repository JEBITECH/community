import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Donation } from './entities/donation.entity';
import { SponsorshipNeed } from './entities/sponsorship-need.entity';
import { Sponsorship } from './entities/sponsorship.entity';
import { DonationsService } from './donations.service';
import { SponsorshipsService } from './sponsorships.service';
import { DonationsController, EventDonationsController, PublicDonationsController } from './donations.controller';
import {
  SponsorshipNeedsController,
  EventSponsorshipNeedsController,
  SponsorshipsController,
  PublicSponsorshipsController,
  PublicSponsorshipNeedsController,
} from './sponsorships.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Event, EventComponent, Participation, Donation, SponsorshipNeed, Sponsorship, Membership]),
  ],
  controllers: [
    DonationsController,
    EventDonationsController,
    PublicDonationsController,
    SponsorshipNeedsController,
    EventSponsorshipNeedsController,
    SponsorshipsController,
    PublicSponsorshipsController,
    PublicSponsorshipNeedsController,
  ],
  providers: [DonationsService, SponsorshipsService],
})
export class DonationsModule {}
