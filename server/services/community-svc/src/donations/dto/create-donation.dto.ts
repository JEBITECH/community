import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateDonationDto {
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
}
