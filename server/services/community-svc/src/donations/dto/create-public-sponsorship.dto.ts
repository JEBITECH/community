import { IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GuestInfoDto } from '../../common/dto/guest-info.dto';

export class CreatePublicSponsorshipDto {
  @IsUUID()
  sponsorship_need_id!: string;

  @IsNumber()
  @Min(1)
  amount_pledged!: number;

  @ValidateNested()
  @Type(() => GuestInfoDto)
  guest!: GuestInfoDto;
}
