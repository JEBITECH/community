import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class OrganizationModuleSubscriptionDto {
  @IsNumber()
  module_id: number;

  @IsString()
  term: 'short' | 'long';

  @IsNumber()
  price: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
