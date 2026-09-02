import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryDto } from './beneficiary.dto';

/** A generous but real ceiling — prevents a single request from being used
 * to script mass-registration / capacity-exhaustion abuse. */
const MAX_BENEFICIARIES = 20;

export class CreateParticipationDto {
  @IsUUID()
  event_id!: string;

  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsIn(['join', 'book'])
  type!: 'join' | 'book';

  /** Required when type='join' to distinguish quick RSVP from the detailed
   * Participate flow. Omit for legacy callers; the server defaults to 'join'. */
  @IsOptional()
  @IsIn(['join', 'participate'])
  registration_method?: 'join' | 'participate';

  /** Legacy path: a plain seat count with no per-person detail. Still
   * honoured when beneficiaries isn't supplied (e.g. simple "Join" / the
   * existing prasad-style seat-count booking), for backward compatibility. */
  @IsOptional()
  @IsInt()
  @Min(1)
  seats_requested?: number;

  /** 'single' = one person (default). 'multiple' = several people under one
   * registration. When beneficiaries is supplied, mode is inferred from its
   * length if not given explicitly. */
  @IsOptional()
  @IsIn(['single', 'multiple'])
  mode?: 'single' | 'multiple';

  /** The "Participate" / "Book" detail flow: who this registration actually
   * covers (self / family member / others), optionally resolved against an
   * existing membership. Omit entirely for a plain one-tap "Join". */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BENEFICIARIES)
  @ValidateNested({ each: true })
  @Type(() => BeneficiaryDto)
  beneficiaries?: BeneficiaryDto[];
}