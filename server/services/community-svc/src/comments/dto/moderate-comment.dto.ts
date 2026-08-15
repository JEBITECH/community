import { IsIn } from 'class-validator';

export class ModerateCommentDto {
  @IsIn(['visible', 'hidden'])
  moderation_status!: 'visible' | 'hidden';
}
