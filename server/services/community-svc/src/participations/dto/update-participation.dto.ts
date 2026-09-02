import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryDto } from './beneficiary.dto';

export class UpdateParticipationDto {
  @IsOptional()
  @IsIn(['single', 'multiple'])
  mode?: 'single' | 'multiple';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BeneficiaryDto)
  beneficiaries!: BeneficiaryDto[];
}
