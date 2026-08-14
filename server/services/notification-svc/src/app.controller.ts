import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';

@Controller()
export class AppController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      service: 'notification-service',
      handledNotifications: this.notificationService.handledCount,
      timestamp: new Date().toISOString(),
    };
  }
}
