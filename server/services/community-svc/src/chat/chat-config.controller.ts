import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ChatConfigService } from './chat-config.service';
import { UpdateChatConfigDto } from './dto/update-chat-config.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';

const CHAT_MANAGERS = ['super_admin', 'core_committee'];

@Controller('events')
@UseGuards(RolesGuard)
export class ChatConfigController {
  constructor(private readonly chatConfigService: ChatConfigService) {}

  @Get(':eventId/chat-config')
  get(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string) {
    return this.chatConfigService.getForEvent(eventId, user);
  }

  @Patch(':eventId/chat-config')
  @Roles(...CHAT_MANAGERS)
  update(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string, @Body() dto: UpdateChatConfigDto) {
    return this.chatConfigService.update(eventId, user, dto);
  }
}
