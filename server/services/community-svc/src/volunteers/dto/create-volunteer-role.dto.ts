import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateVolunteerRoleDto {
  @IsUUID()
  event_id!: string;

  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'slot_start must be in HH:mm format' })
  slot_start?: string;

  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'slot_end must be in HH:mm format' })
  slot_end?: string;

  @IsInt()
  @Min(1)
  headcount_needed!: number;

  /** 'volunteer' (default) = existing seva sign-up. 'book' = shown under
   * the same "Volunteer" heading's new "Book" section. */
  @IsOptional()
  @IsIn(['volunteer', 'book'])
  kind?: 'volunteer' | 'book';
}