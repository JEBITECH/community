import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDiscussionTopicDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  heading?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string | null;
}
