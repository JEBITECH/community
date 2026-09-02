import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiscussionTopicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  heading!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}
