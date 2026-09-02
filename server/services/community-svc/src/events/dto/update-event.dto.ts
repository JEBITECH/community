import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const EVENT_TYPES = [
  'community_program',
  'festival',
  'educational_program',
  'workshop',
  'sports',
  'cultural',
  'meeting',
  'fundraising',
];

const AUDIENCES = ['internal', 'internal_external', 'public', 'invite_only'];

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(EVENT_TYPES)
  event_type?: string;

  @IsOptional()
  @IsBoolean()
  is_multi_day?: boolean;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  cover_image_url?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn(AUDIENCES)
  audience?: string;

  @IsOptional()
  @IsBoolean()
  registration_required?: boolean;

  @IsOptional()
  @IsBoolean()
  booking_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  donation_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  volunteer_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sponsorship_enabled?: boolean;
}
