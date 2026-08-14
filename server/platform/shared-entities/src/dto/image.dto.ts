import { IsBoolean, IsDefined, isDefined, IsOptional, IsString, IsUrl } from "class-validator";

export class ImageDto {
  constructor(partial?: Partial<ImageDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @IsString()
  @IsOptional()
  @IsUrl()
  regular?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  original?: string;

  @IsString()
  @IsOptional()
  _id?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnail?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  large?: string;

  @IsBoolean()
  @IsDefined()
  display_on_digital_handbook?: boolean = false;

  @IsBoolean()
  @IsOptional()
  default?: boolean = false;

  @IsBoolean()
  @IsOptional()
  istaskimage?: boolean = false;

  @IsBoolean()
  @IsOptional()
  istaskroomimage?: boolean = false;
}
