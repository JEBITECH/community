import {
  IsDefined,
  isDefined,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class DirectionInstructionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  instruction?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  image_name?: string;

  @IsDefined()
  @IsNumber()
  order!: number;
}
