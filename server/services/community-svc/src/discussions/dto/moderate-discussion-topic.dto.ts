import { IsBoolean, IsOptional } from 'class-validator';

export class ModerateDiscussionTopicDto {
  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  is_closed?: boolean;
}
