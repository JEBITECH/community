import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

const COMPONENT_TYPES = ['activity', 'seva', 'donation_drive', 'session', 'book'];
const LOCATION_RESOURCES = ['conference_room', 'lab', 'terrace', 'open_space', 'club'];
const AUDIENCES = ['internal', 'internal_external', 'public', 'invite_only'];
const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

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
  @Matches(HH_MM, { message: 'start_time must be in HH:mm format' })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(HH_MM, { message: 'end_time must be in HH:mm format' })
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

  /** Drives the "Participate" button (single/multiple, self/family/other
   * beneficiary detail) — independent of registration_enabled so a schedule
   * item can offer Join, Participate, both, or neither. */
  @IsOptional()
  @IsBoolean()
  participation_enabled?: boolean;

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
  @Matches(HH_MM, { message: 'start_time must be in HH:mm format' })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(HH_MM, { message: 'end_time must be in HH:mm format' })
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

  /** Drives the "Participate" button (single/multiple, self/family/other
   * beneficiary detail) — independent of registration_enabled so a schedule
   * item can offer Join, Participate, both, or neither. */
  @IsOptional()
  @IsBoolean()
  participation_enabled?: boolean;

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
