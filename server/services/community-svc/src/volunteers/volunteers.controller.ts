import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { CreateVolunteerRoleDto } from './dto/create-volunteer-role.dto';
import { CreateVolunteerAssignmentDto } from './dto/create-volunteer-assignment.dto';
import { ReassignVolunteerAssignmentDto } from './dto/reassign-volunteer-assignment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const VOLUNTEER_MANAGERS = ['super_admin', 'core_committee'];

@Controller('events')
@UseGuards(RolesGuard)
export class EventVolunteerRolesController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get(':id/volunteer-roles')
  findForEvent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.volunteersService.findRolesForEvent(id, user);
  }
}

@Controller('volunteer-roles')
@UseGuards(RolesGuard)
export class VolunteerRolesController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post()
  @Roles(...VOLUNTEER_MANAGERS)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateVolunteerRoleDto) {
    return this.volunteersService.createRole(user, dto);
  }

  @Get(':id/assignments')
  @Roles(...VOLUNTEER_MANAGERS)
  findAssignments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.volunteersService.findAssignmentsForRole(id, user);
  }
}

@Controller('volunteer-assignments')
@UseGuards(RolesGuard)
export class VolunteerAssignmentsController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateVolunteerAssignmentDto) {
    return this.volunteersService.create(user, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: RequestUser) {
    return this.volunteersService.findMine(user);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.volunteersService.cancel(id, user);
  }

  @Patch(':id/approve')
  @Roles(...VOLUNTEER_MANAGERS)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.volunteersService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(...VOLUNTEER_MANAGERS)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.volunteersService.reject(id, user);
  }

  @Patch(':id/reassign')
  @Roles(...VOLUNTEER_MANAGERS)
  reassign(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ReassignVolunteerAssignmentDto) {
    return this.volunteersService.reassign(id, user, dto);
  }
}
