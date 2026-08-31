import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendeeDto } from './attendee.dto';

export class CreateParticipationDto {
  @IsUUID()
  event_id!: string;

  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsIn(['join', 'book'])
  type!: 'join' | 'book';

  // Legacy bare seat count — still honored when `attendees` isn't sent, for
  // callers that don't need named per-person detail.
  @IsOptional()
  @IsInt()
  @Min(1)
  seats_requested?: number;

  // "Participate": one row per person (self/family/other). When present,
  // this replaces seats_requested — seat count is derived as attendees.length.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees?: AttendeeDto[];
}
