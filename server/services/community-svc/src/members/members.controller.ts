import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const MEMBER_MANAGERS = ['super_admin', 'core_committee'];

@Controller('members')
@UseGuards(RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findDirectory(@CurrentUser() user: RequestUser) {
    return this.membersService.findDirectory(user);
  }

  @Get('pending')
  @Roles(...MEMBER_MANAGERS)
  findPending(@CurrentUser() user: RequestUser) {
    return this.membersService.findPending(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.membersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...MEMBER_MANAGERS)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(id, user, dto);
  }

  @Patch(':id/approve')
  @Roles(...MEMBER_MANAGERS)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.membersService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(...MEMBER_MANAGERS)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.membersService.reject(id, user);
  }
}
