import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const COMPONENT_TYPES = ['activity', 'seva', 'donation_drive', 'session'];
const LOCATION_RESOURCES = ['conference_room', 'lab', 'terrace', 'open_space', 'club'];
const AUDIENCES = ['internal', 'internal_external', 'public', 'invite_only'];

export class CreateEventComponentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(COMPONENT_TYPES)
  component_type?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  requires_booking?: boolean;

  @IsOptional()
  @IsIn(LOCATION_RESOURCES)
  location_resource?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn(AUDIENCES)
  audience?: string;

  @IsOptional()
  @IsBoolean()
  registration_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  donation_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sponsorship_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  volunteer_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_internal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_external?: number;

  @IsOptional()
  @IsInt()
  sequence?: number;
}

export class UpdateEventComponentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(COMPONENT_TYPES)
  component_type?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  requires_booking?: boolean;

  @IsOptional()
  @IsIn(LOCATION_RESOURCES)
  location_resource?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn(AUDIENCES)
  audience?: string;

  @IsOptional()
  @IsBoolean()
  registration_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  donation_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sponsorship_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  volunteer_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_internal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_external?: number;

  @IsOptional()
  @IsInt()
  sequence?: number;
}
