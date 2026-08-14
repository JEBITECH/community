import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationTemplatesService } from './notification-templates.service';
import {
  CreateNotificationTemplateDto,
  PreviewNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from './dto/notification-templates.dto';

@ApiBearerAuth()
@ApiTags('Notification Templates')
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}

  @Get()
  @ApiOperation({ operationId: 'getNotificationTemplates' })
  findAll(
    @Query('organization_id') organizationId?: string,
    @Query('event_type') eventType?: string,
    @Query('channel') channel?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      organizationId: organizationId ? Number(organizationId) : undefined,
      eventType,
      channel,
      language,
      search,
    });
  }

  @Post('preview')
  @ApiOperation({ operationId: 'previewNotificationTemplate' })
  preview(@Body() dto: PreviewNotificationTemplateDto) {
    return this.service.preview(dto);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getNotificationTemplate' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ operationId: 'createNotificationTemplate' })
  create(@Body() dto: CreateNotificationTemplateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateNotificationTemplate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deactivateNotificationTemplate' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(Number(id));
  }

  @Post(':id/test')
  @ApiOperation({ operationId: 'testNotificationTemplate' })
  test(
    @Param('id') id: string,
    @Body('variables') variables?: Record<string, unknown>,
  ) {
    return this.service.test(Number(id), variables);
  }
}
