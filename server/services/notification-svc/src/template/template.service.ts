import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  DEFAULT_NOTIFICATION_LANGUAGE,
  NotificationChannel,
  renderTemplate,
} from '@shared/common';
import { NotificationTemplateEntity } from '../entities';

export interface RenderedTemplate {
  subject?: string;
  content: string;
  templateId: number;
  version: number;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(NotificationTemplateEntity)
    private readonly templateRepo: Repository<NotificationTemplateEntity>,
  ) {}

  async resolveTemplate(
    eventType: string,
    channel: NotificationChannel,
    language: string = DEFAULT_NOTIFICATION_LANGUAGE,
    organizationId?: number,
    variables: Record<string, unknown> = {},
  ): Promise<RenderedTemplate> {
    const template = await this.findTemplate(
      eventType,
      channel,
      language,
      organizationId,
    );

    if (!template) {
      throw new NotFoundException(
        `No template found for ${eventType}/${channel}/${language}`,
      );
    }

    return this.renderEntity(template, variables);
  }

  async renderWithFallback(
    eventType: string,
    channel: NotificationChannel,
    language: string,
    organizationId: number | undefined,
    variables: Record<string, unknown>,
    fallbackContent?: { subject?: string; content: string },
  ): Promise<RenderedTemplate> {
    try {
      return await this.resolveTemplate(
        eventType,
        channel,
        language,
        organizationId,
        variables,
      );
    } catch (error) {
      const template = await this.findTemplate(
        eventType,
        channel,
        language,
        organizationId,
      );

      if (template?.fallbackTemplateId) {
        const fallback = await this.templateRepo.findOne({
          where: { id: template.fallbackTemplateId, isActive: true },
        });
        if (fallback) {
          this.logger.warn(
            `Using fallback template ${fallback.id} for ${eventType}/${channel}`,
          );
          return this.renderEntity(fallback, variables);
        }
      }

      if (fallbackContent) {
        this.logger.warn(
          `Using inline fallback content for ${eventType}/${channel}`,
        );
        return {
          subject: fallbackContent.subject
            ? renderTemplate(fallbackContent.subject, variables)
            : undefined,
          content: renderTemplate(fallbackContent.content, variables),
          templateId: 0,
          version: 0,
        };
      }

      throw error;
    }
  }

  previewTemplate(
    template: string,
    subject: string | undefined,
    variables: Record<string, unknown>,
    htmlContent?: string,
  ) {
    const content = htmlContent?.trim() ? htmlContent : template;
    return {
      subject: subject ? renderTemplate(subject, variables) : undefined,
      content: renderTemplate(content, variables),
    };
  }

  async createTemplate(data: Partial<NotificationTemplateEntity>) {
    const entity = this.templateRepo.create(data);
    return this.templateRepo.save(entity);
  }

  async listTemplates(eventType?: string) {
    return this.templateRepo.find({
      where: eventType ? { eventType, isActive: true } : { isActive: true },
      order: { eventType: 'ASC', channel: 'ASC', language: 'ASC' },
    });
  }

  private async findTemplate(
    eventType: string,
    channel: NotificationChannel,
    language: string,
    organizationId?: number,
  ) {
    const eventCandidates = this.getNotificationEventCandidates(eventType);

    if (organizationId) {
      for (const candidate of eventCandidates) {
        const orgTemplate = await this.templateRepo.findOne({
          where: {
            eventType: candidate,
            channel,
            language,
            organizationId,
            isActive: true,
          },
          order: { version: 'DESC' },
        });
        if (orgTemplate) {
          return orgTemplate;
        }
      }
    }

    for (const candidate of eventCandidates) {
      const template = await this.templateRepo.findOne({
        where: {
          eventType: candidate,
          channel,
          language,
          organizationId: IsNull(),
          isActive: true,
        },
        order: { version: 'DESC' },
      });
      if (template) {
        return template;
      }
    }

    return null;
  }

  private getNotificationEventCandidates(eventType: string): string[] {
    const normalized = eventType.trim().toLowerCase();
    const candidates = new Set<string>([normalized]);

    if (normalized.startsWith('virtual-inspect.')) {
      candidates.add(normalized.replace(/^virtual-inspect\./, ''));
    }

    const aliases: Record<string, string[]> = {
      'reservation.created': [],
      'auth.otp': [],
      'marketing.promotion': [],
    };

    for (const alias of aliases[normalized] || []) {
      candidates.add(alias);
    }

    return Array.from(candidates);
  }

  private renderEntity(
    template: NotificationTemplateEntity,
    variables: Record<string, unknown>,
  ): RenderedTemplate {
    const content =
      template.htmlContent?.trim() || template.template || template.textContent || '';
    return {
      subject: template.subject
        ? renderTemplate(template.subject, variables)
        : undefined,
      content: renderTemplate(content, variables),
      templateId: template.id,
      version: template.version,
    };
  }
}
