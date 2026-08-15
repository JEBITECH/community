import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Event } from '../events/entities/event.entity';
import { ChatConfig } from './entities/chat-config.entity';
import { UpdateChatConfigDto } from './dto/update-chat-config.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';

export const CHAT_CONFIG_DEFAULTS: Pick<ChatConfig, 'who_can_view' | 'who_can_post' | 'replies_allowed' | 'moderation_required'> = {
  who_can_view: 'internal_and_external',
  who_can_post: 'internal_and_external',
  replies_allowed: true,
  moderation_required: false,
};

@Injectable()
export class ChatConfigService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(ChatConfig) private readonly configRepo: Repository<ChatConfig>,
  ) {}

  /** No user/tenant check — used internally by the socket gateway, which
   * performs its own tenant/permission checks against the resolved event. */
  async resolve(eventId: string): Promise<{ event: Event; config: typeof CHAT_CONFIG_DEFAULTS }> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    const existing = await this.configRepo.findOne({ where: { event_id: eventId } });
    return { event, config: existing ?? CHAT_CONFIG_DEFAULTS };
  }

  async getForEvent(eventId: string, user: RequestUser): Promise<typeof CHAT_CONFIG_DEFAULTS & { event_id: string }> {
    const { event, config } = await this.resolve(eventId);
    assertTenantMatch(event.organization_id, user);
    return { ...config, event_id: eventId };
  }

  async update(eventId: string, user: RequestUser, dto: UpdateChatConfigDto): Promise<ChatConfig> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    let config = await this.configRepo.findOne({ where: { event_id: eventId } });
    if (!config) {
      config = this.configRepo.create({
        organization_id: event.organization_id,
        event_id: eventId,
        ...CHAT_CONFIG_DEFAULTS,
      });
    }
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }
}
