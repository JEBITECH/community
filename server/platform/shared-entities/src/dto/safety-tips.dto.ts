import { IsOptional, IsString, MaxLength } from "class-validator";

export class SafetyTipsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  safety_tip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  tip_details?: string;
}
