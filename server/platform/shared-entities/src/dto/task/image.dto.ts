
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class Image {
  @IsString()
  url!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  area_type?: string;

  @IsBoolean()
  @IsOptional()
  default?: boolean;

  @IsBoolean()
  @IsOptional()
  isTaskImage?: boolean;

  @IsBoolean()
  @IsOptional()
  isTaskRoomImage?: boolean;

  @IsBoolean()
  @IsOptional()
  is_inspector_upload?: boolean;
}
