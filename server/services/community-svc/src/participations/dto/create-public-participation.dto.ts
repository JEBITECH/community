import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GuestInfoDto } from '../../common/dto/guest-info.dto';
import { BeneficiaryDto } from './beneficiary.dto';

const MAX_BENEFICIARIES = 20;

export class CreatePublicParticipationDto {
  @IsUUID()
  event_id!: string;

  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsIn(['join', 'book'])
  type!: 'join' | 'book';

  @IsOptional()
  @IsIn(['join', 'participate'])
  registration_method?: 'join' | 'participate';

  @IsOptional()
  @IsInt()
  @Min(1)
  seats_requested?: number;

  @IsOptional()
  @IsIn(['single', 'multiple'])
  mode?: 'single' | 'multiple';

  /** Guests may add family/other beneficiaries same as members, but a guest
   * beneficiary can never carry a membership_id — resolveBeneficiaries()
   * rejects that combination since a guest has no org membership to grant
   * lookup rights against. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BENEFICIARIES)
  @ValidateNested({ each: true })
  @Type(() => BeneficiaryDto)
  beneficiaries?: BeneficiaryDto[];

  @ValidateNested()
  @Type(() => GuestInfoDto)
  guest!: GuestInfoDto;
}
