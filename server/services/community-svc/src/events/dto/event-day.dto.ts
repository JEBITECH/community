import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
