// organization-pms.dto.ts
import { IsArray, IsString } from "class-validator";

export class OrganizationPropertyLocationDto {
    
  @IsString()
  property_name: string;

  @IsString()
  property_location: string;
}

export class PmsDto {
  @IsString()
  organization_id: number;

  @IsString()
  organization_name: string;

  @IsString()
  pms_name: string;

  @IsArray()
  organization_property_locations: OrganizationPropertyLocationDto[];
}

