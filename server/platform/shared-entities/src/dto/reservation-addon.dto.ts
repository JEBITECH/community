import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ValueType } from '../enums/value-type.enum'; // adjust path

export class ReservationAddonsDto {
  @IsOptional()
  @IsString()
  pms_name?: string;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pms_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  per_day_price?: number;

  @IsOptional()
  @IsString()
  product_category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  owner_value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pms_value?: number;

  @IsOptional()
  @IsEnum(ValueType)
  value_type?: ValueType;
}
