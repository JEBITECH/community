import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '@shared/entities/src/user.entity';
import {
  EVENT_PRIORITY_MAP,
  NotificationChannel,
  NotificationPayload,
  NotificationPriority,
  NotificationStatus,
  ResolvedRecipient,
  SendNotificationRequest,
  OrchestratorResult,
  SUPPORTED_EVENT_TYPES,
} from '@shared/common';
import { NotificationEntity } from '../entities';
import { PreferenceService } from '../preference/preference.service';
import { TemplateService } from '../template/template.service';
import { QueueService } from '../queue/queue.service';

const MVP_CHANNELS = [NotificationChannel.EMAIL, NotificationChannel.IN_APP];

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly preferenceService: PreferenceService,
    private readonly templateService: TemplateService,
    private readonly queueService: QueueService,
  ) {}

  async orchestrate(request: SendNotificationRequest): Promise<OrchestratorResult> {
    this.validateRequest(request);

    const eventId = request.eventId || randomUUID();
    const organizationId = this.parseOptionalNumber(request.organizationId);
    const tenantId = request.organizationId?.toString();
    const recipients = await this.resolveRecipients(request);
    const priority =
      request.priority ||
      EVENT_PRIORITY_MAP[request.eventType] ||
      NotificationPriority.MEDIUM;

    const notificationIds: string[] = [];
    const channelsUsed = new Set<NotificationChannel>();

    for (const recipient of recipients) {
      const preferences = await this.preferenceService.getEffectivePreferences(
        recipient.userId,
        organizationId,
        recipient.role,
        request.eventType,
      );

      if (preferences.doNotDisturb || this.preferenceService.isWithinQuietHours(preferences)) {
        this.logger.debug(
          `Skipping recipient ${recipient.userId ?? recipient.email} due to DND/quiet hours`,
        );
        continue;
      }

      const enabledChannels = MVP_CHANNELS.filter(
        (channel) => preferences.channels[channel],
      );

      for (const channel of enabledChannels) {
        const idempotencyKey = `${eventId}:${recipient.userId ?? recipient.email}:${channel}`;

        const existing = await this.notificationRepo.findOne({
          where: { idempotencyKey },
        });
        if (existing) {
          notificationIds.push(existing.id);
          channelsUsed.add(channel);
          continue;
        }

        const variables = this.buildTemplateVariables(request, recipient);
        const rendered = await this.templateService.renderWithFallback(
          request.eventType,
          channel,
          request.language || 'en',
          organizationId,
          variables,
          {
            subject: request.title,
            content: request.body || request.title || request.eventType,
          },
        );

        const notificationPayload = {
          eventType: request.eventType,
          eventId,
          entityType: this.resolveEntityType(request),
          entityId: request.entityId?.toString(),
          tenantId,
          recipientId: recipient.userId,
          channel,
          status: channel === NotificationChannel.IN_APP ? NotificationStatus.SENT : NotificationStatus.QUEUED,
          payload: request.payload,
          organizationId,
          sourceService: request.sourceService,
          idempotencyKey,
          priority,
          subject: rendered.subject,
          content: rendered.content,
          templateId: rendered.templateId || null,
          reservationId: this.resolveReservationId(request),
        };

        const notification = await this.notificationRepo.save(
          this.notificationRepo.create(notificationPayload),
        );

        if (channel === NotificationChannel.EMAIL && recipient.email) {
          await this.queueService.enqueueEmail(
            {
              notificationId: notification.id,
              eventType: request.eventType,
              channel,
              recipientEmail: recipient.email,
              recipientUserId: recipient.userId,
              subject: rendered.subject,
              content: rendered.content,
              payload: request.payload,
              organizationId: tenantId,
            },
            priority,
            idempotencyKey,
          );
        }

        notificationIds.push(notification.id);
        channelsUsed.add(channel);
      }
    }

    return {
      accepted: notificationIds.length > 0,
      eventId,
      notificationIds,
      channels: Array.from(channelsUsed),
      skippedReason:
        notificationIds.length === 0 ? 'No eligible channels or recipients' : undefined,
    };
  }

  async orchestrateLegacyPayload(
    payload: NotificationPayload,
  ): Promise<OrchestratorResult> {
    return this.orchestrate({
      eventType: payload.type,
      organizationId: payload.organizationId || payload.tenantId,
      sourceService: payload.sourceService,
      eventId: payload.eventId,
      title: payload.title,
      body: payload.body,
      payload: payload.metadata,
      recipients: payload.recipients,
    });
  }

  private validateRequest(request: SendNotificationRequest) {
    if (!request.eventType?.trim()) {
      throw new BadRequestException('eventType is required');
    }

    const isSupported = SUPPORTED_EVENT_TYPES.includes(
      request.eventType as (typeof SUPPORTED_EVENT_TYPES)[number],
    );

    if (!isSupported) {
      this.logger.warn(
        `Event type ${request.eventType} is not in supported list; proceeding anyway`,
      );
    }

    if (
      !request.recipientId &&
      (!request.recipients || request.recipients.length === 0)
    ) {
      throw new BadRequestException(
        'Either recipientId or recipients must be provided',
      );
    }

    if (request.payload && typeof request.payload !== 'object') {
      throw new BadRequestException('payload must be an object');
    }
  }

  private async resolveRecipients(
    request: SendNotificationRequest,
  ): Promise<ResolvedRecipient[]> {
    if (request.recipients?.length) {
      const resolved: ResolvedRecipient[] = [];

      for (const recipient of request.recipients) {
        if (recipient.userId) {
          const user = await this.userRepo.findOne({
            where: { id: recipient.userId },
          });
          resolved.push({
            userId: recipient.userId,
            email: recipient.email || user?.email,
            phone: recipient.phone || user?.phone,
            role: user?.role,
          });
          continue;
        }

        resolved.push(recipient);
      }

      return resolved;
    }

    if (request.recipientId) {
      const user = await this.userRepo.findOne({
        where: { id: request.recipientId.toString() },
      });

      if (!user) {
        throw new BadRequestException(
          `Recipient ${request.recipientId} not found`,
        );
      }

      return [
        {
          userId: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      ];
    }

    return [];
  }

  private buildTemplateVariables(
    request: SendNotificationRequest,
    recipient: ResolvedRecipient,
  ) {
    const payload = (request.payload || {}) as Record<string, unknown>;

    // Auto-derive guestName from firstName + lastName if not explicitly set
    const guestName =
      payload.guestName ||
      [payload.guestFirstName, payload.guestLastName].filter(Boolean).join(' ') ||
      '';

    // Auto-derive recipientName from payload or recipient context
    const recipientName =
      payload.recipientName || guestName || recipient.email || '';

    // Fallback confirmationCode to reservationId if empty
    const confirmationCode =
      payload.confirmationCode || payload.reservationId || '';

    return {
      ...payload,
      guestName,
      recipientName,
      confirmationCode,
      title: request.title,
      body: request.body,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
    };
  }

  private parseOptionalNumber(value?: string | number): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private resolveEntityType(request: SendNotificationRequest): string | undefined {
    if (request.eventType.startsWith('reservation.')) {
      return 'reservation';
    }

    return undefined;
  }

  private resolveReservationId(request: SendNotificationRequest): number | undefined {
    if (this.resolveEntityType(request) !== 'reservation') {
      return undefined;
    }

    return this.parseOptionalNumber(request.entityId);
  }
}
