import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateUserBankAccountDto {
  @IsOptional()
  @IsString()
  bank_owner_name?: string;

  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @IsOptional()
  @IsString()
  bank_account_code?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
