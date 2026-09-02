import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from '../participations/entities/participation.entity';
import { VolunteerRole } from './entities/volunteer-role.entity';
import { VolunteerAssignment } from './entities/volunteer-assignment.entity';
import { VolunteersService } from './volunteers.service';
import { EventVolunteerRolesController, VolunteerRolesController, VolunteerAssignmentsController } from './volunteers.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, EventComponent, Participation, VolunteerRole, VolunteerAssignment, Membership, User])],
  controllers: [EventVolunteerRolesController, VolunteerRolesController, VolunteerAssignmentsController],
  providers: [VolunteersService],
})
export class VolunteersModule {}
