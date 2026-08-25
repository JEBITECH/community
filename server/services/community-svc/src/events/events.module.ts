import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, Organization } from '@shared/entities';
import { Event } from './entities/event.entity';
import { EventDay } from './entities/event-day.entity';
import { EventComponent } from './entities/event-component.entity';
import { EventOrganizer } from './entities/event-organizer.entity';
import { EventsService } from './events.service';
import { EventDaysService } from './event-days.service';
import { EventComponentsService } from './event-components.service';
import { EventsController } from './events.controller';
import { EventDaysController } from './event-days.controller';
import { EventComponentsController } from './event-components.controller';
import { PublicEventsController } from './public-events.controller';
import { CalendarController } from './calendar.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, EventDay, EventComponent, EventOrganizer, Organization, Membership])],
  controllers: [EventsController, EventDaysController, EventComponentsController, PublicEventsController, CalendarController],
  providers: [EventsService, EventDaysService, EventComponentsService],
})
export class EventsModule {}
