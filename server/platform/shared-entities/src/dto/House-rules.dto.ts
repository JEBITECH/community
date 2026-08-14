import { IsOptional, IsString, MaxLength } from "class-validator";

export class HouseRulesDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  house_rule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  house_rule_description?: string;
}
