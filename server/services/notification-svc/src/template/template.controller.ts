import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InternalServiceGuard } from '../auth/internal-service.guard';
import { CreateTemplateDto, PreviewTemplateDto } from '../dto/notification.dto';
import { TemplateService } from './template.service';

@Controller('templates')
@UseGuards(InternalServiceGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templateService.createTemplate(dto);
  }

  @Get()
  listTemplates(@Query('eventType') eventType?: string) {
    return this.templateService.listTemplates(eventType);
  }

  @Post('preview')
  previewTemplate(@Body() dto: PreviewTemplateDto) {
    return this.templateService.previewTemplate(
      dto.template,
      dto.subject,
      dto.variables,
      dto.htmlContent,
    );
  }
}
