import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class FranchiseItemDto {
  @IsNumber()
  id: number;

  @IsString()
  franchise_id: string;

  @IsString()
  organization_name: string;

  @IsString()
  organization_location: string;

  @IsString()
  organization_status: string;

  @IsBoolean()
  is_franchisor: boolean;

  @IsNumber()
  parent_org_id: number | null;

  @IsNumber()
  user_count: number;

  @IsString()
  super_admin_name: string;

  @IsString()
  super_admin_email: string;
}
