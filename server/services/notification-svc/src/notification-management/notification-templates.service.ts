import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { renderTemplate } from '@shared/common';
import { NotificationTemplateEntity } from '@shared/entities';
import { QueryFailedError, Repository } from 'typeorm';
import {
  CreateNotificationTemplateDto,
  PreviewNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from './dto/notification-templates.dto';

@Injectable()
export class NotificationTemplatesService {
  constructor(
    @InjectRepository(NotificationTemplateEntity)
    private readonly templates: Repository<NotificationTemplateEntity>,
  ) {}

  private rethrowTemplateError(error: unknown, fallbackMessage: string): never {
    if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
      throw error;
    }

    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        detail?: string;
        constraint?: string;
        message?: string;
      };

      if (driverError?.code === '23505' || driverError?.constraint === 'uq_notification_templates_version') {
        throw new ConflictException(
          'A notification template already exists for this event, channel, language, organization, and version.',
        );
      }

      if (driverError?.code === '23503') {
        throw new BadRequestException(
          driverError.detail || 'One of the referenced records does not exist.',
        );
      }

      throw new BadRequestException(driverError.detail || driverError.message || fallbackMessage);
    }

    const message = error instanceof Error ? error.message : fallbackMessage;
    throw new InternalServerErrorException(message || fallbackMessage);
  }

  findAll(params: {
    organizationId?: number;
    eventType?: string;
    channel?: string;
    language?: string;
    search?: string;
  }) {
    const query = this.templates
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.fallbackTemplate', 'fallbackTemplate')
      .where('template.isActive = true')
      .orderBy('template.updatedAt', 'DESC');

    if (params.organizationId !== undefined) {
      query.andWhere(
        '(template.organizationId = :organizationId OR template.organizationId IS NULL)',
        { organizationId: params.organizationId },
      );
    }

    if (params.eventType) {
      query.andWhere('template.eventType = :eventType', {
        eventType: params.eventType,
      });
    }

    if (params.channel) {
      query.andWhere('template.channel = :channel', { channel: params.channel });
    }

    if (params.language) {
      query.andWhere('template.language = :language', {
        language: params.language,
      });
    }

    if (params.search) {
      query.andWhere(
        '(template.name ILIKE :search OR template.eventType ILIKE :search OR template.subject ILIKE :search OR template.template ILIKE :search OR template.htmlContent ILIKE :search OR template.textContent ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const template = await this.templates.findOne({
      where: { id },
      relations: { fallbackTemplate: true },
    });

    if (!template) {
      throw new NotFoundException(`Notification template ${id} not found`);
    }

    return template;
  }

  async create(dto: CreateNotificationTemplateDto) {
    try {
      const htmlContent = dto.htmlContent?.trim()
        ? dto.htmlContent
        : dto.template?.trim()
          ? dto.template
          : dto.textContent ?? '';
      const templateBody = dto.template?.trim() ? dto.template : htmlContent;

      return await this.templates.save(
        this.templates.create({
          name: dto.name ?? null,
          description: dto.description ?? null,
          eventType: dto.eventType,
          channel: dto.channel,
          language: dto.language || 'en',
          organizationId: dto.organizationId ?? null,
          category: dto.category ?? 'transactional',
          type: dto.type ?? dto.eventType,
          htmlContent: dto.htmlContent ?? htmlContent,
          textContent: dto.textContent ?? null,
          jsonContent: dto.jsonContent ?? null,
          variables: dto.variables ?? [],
          preheader: dto.preheader ?? null,
          template: templateBody,
          subject: dto.subject ?? null,
          status: dto.status ?? 'draft',
          isDefault: dto.isDefault ?? false,
          version: dto.version ?? 1,
          isActive: dto.isActive ?? true,
          fallbackTemplateId: dto.fallbackTemplateId ?? null,
          createdBy: dto.createdBy ?? null,
          updatedBy: dto.updatedBy ?? null,
        }),
      );
    } catch (error) {
      this.rethrowTemplateError(error, 'Failed to create notification template');
    }
  }

  async update(id: number, dto: UpdateNotificationTemplateDto) {
    try {
      const template = await this.findOne(id);
      Object.assign(template, {
        ...(dto.eventType !== undefined ? { eventType: dto.eventType } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        ...(dto.organizationId !== undefined
          ? { organizationId: dto.organizationId }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.htmlContent !== undefined ? { htmlContent: dto.htmlContent } : {}),
        ...(dto.textContent !== undefined ? { textContent: dto.textContent } : {}),
        ...(dto.jsonContent !== undefined ? { jsonContent: dto.jsonContent } : {}),
        ...(dto.variables !== undefined ? { variables: dto.variables } : {}),
        ...(dto.preheader !== undefined ? { preheader: dto.preheader } : {}),
        ...(dto.template !== undefined ? { template: dto.template } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.version !== undefined ? { version: dto.version } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.createdBy !== undefined ? { createdBy: dto.createdBy } : {}),
        ...(dto.updatedBy !== undefined ? { updatedBy: dto.updatedBy } : {}),
        ...(dto.fallbackTemplateId !== undefined
          ? { fallbackTemplateId: dto.fallbackTemplateId }
          : {}),
      });

      return await this.templates.save(template);
    } catch (error) {
      this.rethrowTemplateError(error, `Failed to update notification template ${id}`);
    }
  }

  async deactivate(id: number) {
    try {
      const template = await this.findOne(id);
      template.isActive = false;
      template.deletedAt = new Date();
      return await this.templates.save(template);
    } catch (error) {
      this.rethrowTemplateError(error, `Failed to deactivate notification template ${id}`);
    }
  }

  preview(dto: PreviewNotificationTemplateDto) {
    try {
      const variables = dto.variables ?? {};
      const content = dto.htmlContent?.trim() ? dto.htmlContent : dto.template;
      return {
        subject: dto.subject ? renderTemplate(dto.subject, variables) : null,
        body: renderTemplate(content, variables),
      };
    } catch (error) {
      this.rethrowTemplateError(error, 'Failed to render notification template preview');
    }
  }

  async test(id: number, variables: Record<string, unknown> = {}) {
    try {
      const template = await this.findOne(id);
      return {
        templateId: template.id,
        channel: template.channel,
        language: template.language,
        rendered: this.preview({
          subject: template.subject ?? undefined,
          template: template.template,
          htmlContent: template.htmlContent ?? undefined,
          variables,
        }),
      };
    } catch (error) {
      this.rethrowTemplateError(error, `Failed to test notification template ${id}`);
    }
  }
}
