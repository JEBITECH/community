import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const AUDIENCES = ['internal', 'internal_external', 'public', 'invite_only'];

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
}