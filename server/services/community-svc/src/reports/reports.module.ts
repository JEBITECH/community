import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Sponsorship } from '../donations/entities/sponsorship.entity';
import { VolunteerRole } from '../volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from '../volunteers/entities/volunteer-assignment.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Participation, Donation, Sponsorship, VolunteerRole, VolunteerAssignment])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
