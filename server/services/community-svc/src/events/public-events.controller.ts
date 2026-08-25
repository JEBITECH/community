import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

/**
 * Guest-facing, unauthenticated reads — mounted under /public so the gateway's
 * JwtAuthGuard can allowlist the whole namespace with one wildcard entry.
 */
@Controller('public/events')
export class PublicEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findPublished(@Query('subdomain') subdomain: string) {
    return this.eventsService.findPublishedBySubdomain(subdomain);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOnePublic(id);
  }
}
