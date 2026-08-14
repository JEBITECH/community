// theme-config.dto.ts
import { IsOptional, IsString } from "class-validator";

export class ThemeConfigDto {
  @IsOptional()
  @IsString()
  primary_color?: string;

  @IsOptional()
  @IsString()
  secondary_color?: string;

  @IsOptional()
  @IsString()
  font_family?: string;
}
