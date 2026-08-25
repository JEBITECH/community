import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ApiError } from '@shared/common';
import { User } from '@shared/entities';
import { EventChatMessage } from './entities/event-chat-message.entity';
import { ChatConfigService } from './chat-config.service';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { assertChatAccess } from '../common/helpers/chat-permission.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret';

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: number | null;
}

/**
 * The client connects here directly (not through the gateway proxy — Socket.io
 * upgrades don't cleanly traverse the REST reverse proxy), authenticating with
 * the same original auth-svc-issued access token used for REST calls rather
 * than the gateway's re-signed x-user-token, so JWT_ACCESS_SECRET must match
 * auth-svc's exactly (already true in this repo's env files).
 */
@WebSocketGateway({ namespace: '/community/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly chatConfigService: ChatConfigService,
    private readonly membershipResolver: MembershipResolverService,
    @InjectRepository(EventChatMessage) private readonly messageRepo: Repository<EventChatMessage>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  handleConnection(client: Socket): void {
    const token = (client.handshake.auth?.token as string | undefined) || client.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET, { issuer: 'auth-service', audience: 'community-system' }) as AccessTokenPayload;
      client.data.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        organization_id: payload.organizationId,
      } as RequestUser;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // Socket.io's own room bookkeeping handles cleanup; nothing app-level to do.
  }

  @SubscribeMessage('join')
  async onJoin(@MessageBody() data: { event_id?: string }, @ConnectedSocket() client: Socket): Promise<void> {
    const user = client.data.user as RequestUser | undefined;
    if (!user || !data?.event_id) {
      client.emit('chat_error', { message: 'Not authenticated or missing event_id' });
      return;
    }
    try {
      const { event, config } = await this.chatConfigService.resolve(data.event_id);
      assertTenantMatch(event.organization_id, user);
      const membership = await this.membershipResolver.resolve(user);
      assertChatAccess(config.who_can_view, membership, user.role, 'view');

      client.data.membershipId = membership.id;
      const sender = await this.userRepo.findOne({ where: { id: user.id } });
      client.data.displayName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Member';

      client.join(`event:${data.event_id}`);
      client.emit('joined', { event_id: data.event_id });
    } catch (err) {
      client.emit('chat_error', { message: err instanceof ApiError ? err.message : 'Could not join chat', code: (err as ApiError)?.code });
    }
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() data: { event_id?: string; event_component_id?: string; body?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client.data.user as RequestUser | undefined;
    const body = data?.body?.trim();
    if (!user || !data?.event_id || !body) {
      client.emit('chat_error', { message: 'Missing event_id or body' });
      return;
    }
    if (body.length > 1000) {
      client.emit('chat_error', { message: 'Message is too long' });
      return;
    }

    try {
      const { event, config } = await this.chatConfigService.resolve(data.event_id);
      assertTenantMatch(event.organization_id, user);
      const membership = await this.membershipResolver.resolve(user);
      assertChatAccess(config.who_can_post, membership, user.role, 'post');

      const message = await this.messageRepo.save(
        this.messageRepo.create({
          organization_id: event.organization_id,
          event_id: event.id,
          event_component_id: data.event_component_id,
          membership_id: membership.id,
          body,
        }),
      );

      this.server.to(`event:${data.event_id}`).emit('message', {
        ...message,
        sender_name: client.data.displayName || 'Member',
      });
    } catch (err) {
      client.emit('chat_error', { message: err instanceof ApiError ? err.message : 'Could not send message', code: (err as ApiError)?.code });
    }
  }
}
