import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const AUDIENCES = ['internal', 'internal_external', 'public', 'invite_only'];
const REGISTRATION_MODES = ['join', 'participate', 'both'];

export class CreateEventDayDto {
  @IsInt()
  @Min(1)
  day_number!: number;

  @IsDateString()
  date!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sequence?: number;

  @IsOptional()
  @IsIn(AUDIENCES)
  audience?: string;

  /** 'join' / 'participate' restrict every activity added under this day to
   * that single registration type; 'both' (default) leaves each activity
   * free to choose either/both individually, same as before this feature
   * existed. Enforced server-side, not just a UI default. */
  @IsOptional()
  @IsIn(REGISTRATION_MODES)
  registration_mode?: string;
}

export class UpdateEventDayDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  day_number?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sequence?: number;

  @IsOptional()
  @IsIn(AUDIENCES)
  audience?: string;

  @IsOptional()
  @IsIn(REGISTRATION_MODES)
  registration_mode?: string;
}