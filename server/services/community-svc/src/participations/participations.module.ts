import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from './entities/participation.entity';
import { Booking } from './entities/booking.entity';
import { BookingAttendee } from './entities/booking-attendee.entity';
import { ParticipationsService } from './participations.service';
import { ParticipationsController, ComponentAvailabilityController, PublicParticipationsController } from './participations.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, EventComponent, Participation, Booking, BookingAttendee])],
  controllers: [ParticipationsController, ComponentAvailabilityController, PublicParticipationsController],
  providers: [ParticipationsService],
})
export class ParticipationsModule {}
