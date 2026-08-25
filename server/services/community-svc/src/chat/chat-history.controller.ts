import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { EventChatMessage } from './entities/event-chat-message.entity';
import { ChatConfigService } from './chat-config.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { assertChatAccess } from '../common/helpers/chat-permission.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';

const HISTORY_PAGE_SIZE = 50;

@Controller('events')
@UseGuards(RolesGuard)
export class ChatHistoryController {
  constructor(
    @InjectRepository(EventChatMessage) private readonly messageRepo: Repository<EventChatMessage>,
    private readonly chatConfigService: ChatConfigService,
    private readonly membershipResolver: MembershipResolverService,
  ) {}

  @Get(':eventId/chat/history')
  async history(
    @CurrentUser() user: RequestUser,
    @Param('eventId') eventId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const { event, config } = await this.chatConfigService.resolve(eventId);
    assertTenantMatch(event.organization_id, user);
    const membership = await this.membershipResolver.resolve(user);
    assertChatAccess(config.who_can_view, membership, user.role, 'view');

    const pageSize = Math.min(Number(limit) || HISTORY_PAGE_SIZE, HISTORY_PAGE_SIZE);
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.event_id = :eventId', { eventId })
      .andWhere('m.is_deleted = false');
    if (before) {
      const beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        throw new ApiError('before must be a valid ISO timestamp', 400, 'VALIDATION_ERROR');
      }
      qb.andWhere('m.createdAt < :before', { before: beforeDate });
    }

    const messages = await qb.orderBy('m.createdAt', 'DESC').take(pageSize).getMany();
    return messages.reverse();
  }
}
