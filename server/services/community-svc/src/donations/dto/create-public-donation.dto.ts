import { IsIn, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GuestInfoDto } from '../../common/dto/guest-info.dto';

export class CreatePublicDonationDto {
  @IsUUID()
  event_id!: string;

  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsIn(['event', 'component', 'general'])
  purpose?: string;

  @ValidateNested()
  @Type(() => GuestInfoDto)
  guest!: GuestInfoDto;
}
