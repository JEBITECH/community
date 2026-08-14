import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationPayload,
  OrchestratorResult,
  SendNotificationRequest,
} from '@shared/common';
import { NotificationDeliveryLogEntity, NotificationEntity } from '../entities';
import { OrchestratorService } from '../orchestrator/orchestrator.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private count = 0;

  constructor(
    private readonly orchestratorService: OrchestratorService,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationDeliveryLogEntity)
    private readonly deliveryLogRepo: Repository<NotificationDeliveryLogEntity>,
  ) {}

  get handledCount() {
    return this.count;
  }

  async send(request: SendNotificationRequest): Promise<OrchestratorResult> {
    const result = await this.orchestratorService.orchestrate(request);
    this.count += result.notificationIds.length;

    this.logger.log(
      JSON.stringify({
        event: 'notification.send.accepted',
        eventId: result.eventId,
        notificationCount: result.notificationIds.length,
        channels: result.channels,
      }),
    );

    return result;
  }

  async handleVirtualInspectNotification(
    payload: NotificationPayload,
  ): Promise<OrchestratorResult> {
    this.logger.debug(
      `Received legacy virtual-inspect notification: ${payload.eventId}`,
    );

    return this.orchestratorService.orchestrateLegacyPayload(payload);
  }

  async getStatus(notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    const deliveryLogs = await this.deliveryLogRepo.find({
      where: { notificationId },
      order: { createdAt: 'DESC' },
    });

    return {
      id: notification.id,
      eventType: notification.eventType,
      channel: notification.channel,
      status: notification.status,
      recipientId: notification.recipientId,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      deliveryLogs,
    };
  }
}
