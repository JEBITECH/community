import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InternalServiceGuard } from '../auth/internal-service.guard';
import { SendNotificationDto } from '../dto/notification.dto';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(InternalServiceGuard)
  async sendNotification(
    @Body() dto: SendNotificationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.notificationService.send({
      ...dto,
      eventId: dto.eventId || idempotencyKey,
    });
  }

  @Get(':id/status')
  @UseGuards(InternalServiceGuard)
  getNotificationStatus(@Param('id') id: string) {
    return this.notificationService.getStatus(id);
  }
}
