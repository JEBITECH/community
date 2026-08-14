import { IsString, IsOptional, MaxLength } from "class-validator";

export class NotesDto {

  @IsString()
  @IsOptional()
  @MaxLength(250)
  about?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  wifi_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  wifi_password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  trash_info?: string;
}
