import { IsOptional, IsString, MaxLength } from "class-validator";

export class PropertyQuirksDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  quirk_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  quirk_description?: string;
}
