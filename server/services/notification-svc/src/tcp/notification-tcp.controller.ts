import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { NOTIFICATION_EVENTS, NotificationPayload, SendNotificationRequest } from '@shared/common';
import { NotificationService } from '../notification/notification.service';
import { NotificationBootstrapService } from '../bootstrap/bootstrap.service';
import {
  BootstrapCompanyPreferenceDto,
  BootstrapRolePreferenceDto,
  BootstrapUserPreferenceDto,
} from '../dto/notification.dto';

@Controller()
export class NotificationTcpController {
  private readonly logger = new Logger(NotificationTcpController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationBootstrapService: NotificationBootstrapService,
  ) {}

  @EventPattern(NOTIFICATION_EVENTS.VIRTUAL_INSPECT_NOTIFICATION)
  async handleVirtualInspectNotification(@Payload() payload: NotificationPayload) {
    this.logger.debug(
      `Received ${NOTIFICATION_EVENTS.VIRTUAL_INSPECT_NOTIFICATION}`,
    );

    const result =
      await this.notificationService.handleVirtualInspectNotification(payload);

    this.logger.log(
      `Handled ${NOTIFICATION_EVENTS.VIRTUAL_INSPECT_NOTIFICATION}: ${JSON.stringify(result)}`,
    );

    return result;
  }

  @EventPattern(NOTIFICATION_EVENTS.SEND_NOTIFICATION)
  async handleSendNotification(@Payload() payload: SendNotificationRequest) {
    this.logger.debug(`Received ${NOTIFICATION_EVENTS.SEND_NOTIFICATION}: ${payload.eventType}`);
    return this.notificationService.send(payload);
  }

  @EventPattern(NOTIFICATION_EVENTS.RESERVATION_CREATED)
  async handleReservationCreated(@Payload() payload: SendNotificationRequest) {
    this.logger.debug(`Received ${NOTIFICATION_EVENTS.RESERVATION_CREATED}`);
    return this.notificationService.send(payload);
  }

  @EventPattern(NOTIFICATION_EVENTS.RESERVATION_CONFIRMED)
  async handleReservationConfirmed(@Payload() payload: SendNotificationRequest) {
    this.logger.debug(`Received ${NOTIFICATION_EVENTS.RESERVATION_CONFIRMED}`);
    return this.notificationService.send(payload);
  }

  @EventPattern(NOTIFICATION_EVENTS.RESERVATION_CANCELLED)
  async handleReservationCancelled(@Payload() payload: SendNotificationRequest) {
    this.logger.debug(`Received ${NOTIFICATION_EVENTS.RESERVATION_CANCELLED}`);
    return this.notificationService.send(payload);
  }

  @MessagePattern(NOTIFICATION_EVENTS.BOOTSTRAP_COMPANY_PREFERENCE)
  bootstrapCompanyPreference(@Payload() payload: BootstrapCompanyPreferenceDto) {
    return this.notificationBootstrapService.bootstrapCompanyPreference(payload);
  }

  @MessagePattern(NOTIFICATION_EVENTS.BOOTSTRAP_ROLE_PREFERENCE)
  bootstrapRolePreference(@Payload() payload: BootstrapRolePreferenceDto) {
    return this.notificationBootstrapService.bootstrapRolePreference(payload);
  }

  @MessagePattern(NOTIFICATION_EVENTS.BOOTSTRAP_USER_PREFERENCE)
  bootstrapUserPreference(@Payload() payload: BootstrapUserPreferenceDto) {
    return this.notificationBootstrapService.bootstrapUserPreference(payload);
  }
}
