import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, Organization } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Sponsorship } from '../donations/entities/sponsorship.entity';
import { VolunteerRole } from '../volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from '../volunteers/entities/volunteer-assignment.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Membership, Organization, Participation, Donation, Sponsorship, VolunteerRole, VolunteerAssignment]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
