import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export class NotificationClientService {
  private client: ClientProxy | null = null;

  private getClient(): ClientProxy {
    if (!this.client) {
      this.client = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: {
          host: process.env.NOTIFICATION_MICROSERVICE_HOST || 'localhost',
          port: Number(
            process.env.PORT_TCP ||
              process.env.NOTIFICATION_MICROSERVICE_PORT ||
              process.env.ERP_NOTIFICATION_TCP_PORT ||
              6011,
          ),
        },
      });
    }

    return this.client;
  }

  async send<TResponse = unknown>(pattern: string, data: unknown): Promise<TResponse> {
    try {
      return await firstValueFrom(this.getClient().send<TResponse>(pattern, data));
    } catch (error: any) {
      console.error(
        `[NotificationClientService] Failed to send ${pattern}:`,
        error?.message || error,
      );
      return null as TResponse;
    }
  }
}
