import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { NOTIFICATION_EVENTS, SendNotificationRequest } from '@shared/common';

/**
 * Fire-and-forget TCP client into notification-svc, mirroring auth-svc's own
 * notification-client pattern (same event name, same env vars) but built as
 * a real Nest injectable since community-svc is a real Nest app.
 */
@Injectable()
export class NotificationClientService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationClientService.name);
  private readonly client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.NOTIFICATION_MICROSERVICE_HOST || 'localhost',
        port: Number(process.env.NOTIFICATION_MICROSERVICE_PORT || 6011),
      },
    });
  }

  /** Never awaited by callers — a notification-svc outage must never block
   * the community-svc action (event publish, payment recorded, etc.) that
   * triggered it, only log the failure. */
  send(request: SendNotificationRequest): void {
    this.client.emit(NOTIFICATION_EVENTS.SEND_NOTIFICATION, { sourceService: 'community-svc', ...request }).subscribe({
      error: (err) => this.logger.warn(`notification.send failed: ${err?.message || err}`),
    });
  }

  onModuleDestroy(): void {
    this.client.close();
  }
}
