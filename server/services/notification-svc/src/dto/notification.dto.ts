import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel, NotificationPriority } from '@shared/common';

export class NotificationRecipientDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsOptional()
  entityId?: string | number;

  @IsOptional()
  recipientId?: string | number;

  @IsOptional()
  organizationId?: string | number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientDto)
  recipients?: NotificationRecipientDto[];

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  sourceService?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class BootstrapCompanyPreferenceDto {
  @IsNumber()
  @Type(() => Number)
  organizationId!: number;

  @IsOptional()
  @IsObject()
  channels?: {
    allowEmail?: boolean;
    allowSms?: boolean;
    allowPush?: boolean;
    allowWhatsapp?: boolean;
    allowInApp?: boolean;
  };
}

export class BootstrapRolePreferenceDto {
  @IsNumber()
  @Type(() => Number)
  organizationId!: number;

  @IsString()
  role!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  roleId?: number | null;

  @IsOptional()
  @IsObject()
  eventPreferences?: Record<string, boolean>;
}

export class BootstrapUserPreferenceDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizationId?: number;

  @IsOptional()
  @IsObject()
  channels?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    whatsapp?: boolean;
  };

  @IsOptional()
  @IsString()
  quietHoursStart?: string | null;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string | null;

  @IsOptional()
  @IsString()
  timezone?: string | null;

  @IsOptional()
  @IsBoolean()
  doNotDisturb?: boolean;
}

export class UpsertUserPreferenceDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizationId?: number;

  @IsObject()
  channels!: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    whatsapp?: boolean;
  };

  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  doNotDisturb?: boolean;
}

export class UpsertCompanyPreferenceDto {
  @IsNumber()
  @Type(() => Number)
  organizationId!: number;

  @IsObject()
  channels!: {
    allowEmail?: boolean;
    allowSms?: boolean;
    allowPush?: boolean;
    allowWhatsapp?: boolean;
    allowInApp?: boolean;
  };
}

export class UpsertRolePreferenceDto {
  @IsString()
  role!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizationId?: number;

  @IsObject()
  eventPreferences!: Record<string, boolean>;
}

export class CreateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  eventType!: string;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizationId?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  jsonContent?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsString()
  preheader?: string;

  @IsString()
  template!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsNumber()
  fallbackTemplateId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class PreviewTemplateDto {
  @IsString()
  template!: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsObject()
  variables!: Record<string, unknown>;
}
