import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserChannelPreferencesDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;
}

export class CompanyChannelPreferencesDto {
  @IsOptional()
  @IsBoolean()
  allowEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSms?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPush?: boolean;

  @IsOptional()
  @IsBoolean()
  allowWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  allowInApp?: boolean;
}

export class UpsertUserNotificationPreferenceDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organizationId?: number;

  @IsObject()
  channels!: UserChannelPreferencesDto;

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
  @IsBoolean()
  doNotDisturb?: boolean;
}

export class CompanySettingsDto {
  @IsOptional()
  @IsBoolean()
  notifyManagerForUpcomingTask?: boolean;

  @IsOptional()
  intervals?: number[]
}

export class UpsertCompanyNotificationPreferenceDto {
  @Type(() => Number)
  @IsInt()
  organizationId!: number;

  @IsObject()
  channels!: CompanyChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  settings?: CompanySettingsDto;
}

export class UpsertRoleNotificationPreferenceDto {
  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organizationId?: number;

  @IsObject()
  eventPreferences!: Record<string, boolean>;
}

export class UpsertDeviceTokenDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organizationId?: number;

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  platform!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  lastSeenAt?: string;
}

export class UpdateDeviceTokenDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  lastSeenAt?: string;
}
