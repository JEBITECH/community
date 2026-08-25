import { Body, Controller, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { EventComponentsService } from './event-components.service';
import { UpdateEventComponentDto } from './dto/event-component.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const EVENT_MANAGERS = ['super_admin', 'core_committee'];

@Controller('components')
@UseGuards(RolesGuard)
export class EventComponentsController {
  constructor(private readonly eventComponentsService: EventComponentsService) {}

  @Patch(':id')
  @Roles(...EVENT_MANAGERS)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateEventComponentDto) {
    return this.eventComponentsService.update(id, user, dto);
  }

  @Delete(':id')
  @Roles(...EVENT_MANAGERS)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventComponentsService.remove(id, user);
  }
}
