import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsOptional()
  @IsUUID()
  event_component_id?: string;

  @IsOptional()
  @IsUUID()
  discussion_topic_id?: string;

  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;
}
