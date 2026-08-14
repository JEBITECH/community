import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApplianceInstructionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appliance_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  appliance_instruction?: string;
}
