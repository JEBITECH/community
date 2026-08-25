import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSponsorshipNeedDto {
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

  @IsNumber()
  @Min(1)
  target_amount!: number;
}

export class CreateSponsorshipDto {
  @IsUUID()
  sponsorship_need_id!: string;

  @IsNumber()
  @Min(1)
  amount_pledged!: number;
}
