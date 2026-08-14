import { IsOptional } from "class-validator";

export class ProductConditionDto {
  @IsOptional()
  included?: any[];

  @IsOptional()
  excluded?: any[];

  @IsOptional()
  includedPercentages?: Record<string, number>;

  @IsOptional()
  excludedPercentages?: Record<string, number>;
}