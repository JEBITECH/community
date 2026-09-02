import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from './entities/participation.entity';
import { ParticipationBeneficiary } from './entities/participation-beneficiary.entity';
import { Booking } from './entities/booking.entity';
import { ParticipationsService } from './participations.service';
import { ParticipationsController, ComponentAvailabilityController, PublicParticipationsController } from './participations.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Event, EventComponent, Participation, ParticipationBeneficiary, Booking, Membership, User]),
  ],
  controllers: [ParticipationsController, ComponentAvailabilityController, PublicParticipationsController],
  providers: [ParticipationsService],
})
export class ParticipationsModule {}
