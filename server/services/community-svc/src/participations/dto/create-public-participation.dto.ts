import { IsIn, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GuestInfoDto } from '../../common/dto/guest-info.dto';

export class CreatePublicParticipationDto {
  @IsUUID()
  event_id!: string;

  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsIn(['join', 'book'])
  type!: 'join' | 'book';

  @IsOptional()
  @IsInt()
  @Min(1)
  seats_requested?: number;

  @ValidateNested()
  @Type(() => GuestInfoDto)
  guest!: GuestInfoDto;
}
