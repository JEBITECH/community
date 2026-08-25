import { IsBoolean, IsIn, IsOptional } from 'class-validator';

const VISIBILITY_VALUES = ['internal_only', 'internal_and_external', 'admin_only'];

export class UpdateChatConfigDto {
  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  who_can_view?: 'internal_only' | 'internal_and_external' | 'admin_only';

  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  who_can_post?: 'internal_only' | 'internal_and_external' | 'admin_only';

  @IsOptional()
  @IsBoolean()
  replies_allowed?: boolean;

  @IsOptional()
  @IsBoolean()
  moderation_required?: boolean;
}
