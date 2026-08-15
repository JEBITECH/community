import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      service: 'community-service',
      timestamp: new Date().toISOString(),
    };
  }
}
