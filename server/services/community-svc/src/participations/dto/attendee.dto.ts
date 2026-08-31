import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * One attendee within a "Participate" (book) request — self, a family
 * member, or someone else. 'self' is auto-named server-side from the
 * caller's own profile regardless of what's sent here; `name` only matters
 * for 'family'/'other'. `membership_id`, when set, resolves the name from
 * that member's own profile too (the "fetch the data" lookup) rather than
 * trusting the client-supplied name.
 */
export class AttendeeDto {
  @IsIn(['self', 'family', 'other'])
  attendee_type!: 'self' | 'family' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID()
  membership_id?: string;
}
