import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  IsLatitude,
  IsLongitude,
} from "class-validator";

export class CreateUserAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  address_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  full?: string;

  @IsOptional()
  @IsNumber()
  country_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address_line_1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address_line_2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
