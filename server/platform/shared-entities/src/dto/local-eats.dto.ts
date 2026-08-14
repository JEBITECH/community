import { IsOptional, IsString, MaxLength } from "class-validator";

export class LocalEatsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  restaurant_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
