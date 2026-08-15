import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateParticipationDto {
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
}
