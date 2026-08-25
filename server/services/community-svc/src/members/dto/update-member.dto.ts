import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  unit_identifier?: string;

  @IsOptional()
  @IsBoolean()
  directory_visible?: boolean;
}
