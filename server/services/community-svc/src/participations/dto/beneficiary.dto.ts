import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const RELATION_TYPES = ['self', 'family', 'other'];

export class BeneficiaryDto {
  @IsIn(RELATION_TYPES)
  relation_type!: 'self' | 'family' | 'other';

  /**
   * Required for 'family' / 'other'. Ignored (and overwritten) for 'self' —
   * the server always fills the registrant's own name in from their
   * membership, never trusts a client-supplied name for their own record.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  full_name?: string;

  /**
   * Optional for 'family' / 'other': when the beneficiary is themselves a
   * member of this organization, supplying their membership ID lets the
   * server resolve and auto-fill their name ("add more details ... to fetch
   * the data" in the requirements) instead of the registrant typing it by
   * hand. Not accepted for 'self' — that is always the caller's own
   * membership, resolved server-side.
   */
  @IsOptional()
  @IsUUID()
  membership_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  notes?: string;
}