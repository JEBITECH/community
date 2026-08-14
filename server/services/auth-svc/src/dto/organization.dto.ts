import { PmsMasterDto } from "./pmsmaster.dto";
import { IsString, IsArray, IsObject, IsOptional, ValidateNested, IsBoolean, IsNumber, MaxLength } from 'class-validator'
import { OrganizationUserDto } from "./organizationuser.dto";
import { Type } from "class-transformer";
import { ThemeConfigDto } from "./themeConfig.dto";
import { OrganizationModuleSubscriptionDto } from "./OrganizationModuleSubscription.dto";
import { PropertyLocationDto } from "./PropertyLocation.dto";

export class OrganizationDto {

    @IsString()
    @MaxLength(50)
    organization_name?: string;

    @IsString()
    organization_email?: string;

    @IsString()
    @MaxLength(50)
    organization_location?: string;

    @IsOptional()
    @IsString()
    organization_timezone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    organization_contact_info?: string;

    @IsObject()
    super_admin?: OrganizationUserDto;

    @IsArray()
    pms_master: PmsMasterDto[];

    @IsArray()
    module_ids: number[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrganizationModuleSubscriptionDto)
    module_subscriptions: OrganizationModuleSubscriptionDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PropertyLocationDto)
    organization_property_locations?: PropertyLocationDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => ThemeConfigDto)
    themeConfig?: ThemeConfigDto;

    @IsOptional()
    @IsString()
    organization_logo?: string;

    @IsOptional()
    @IsBoolean()
    is_franchisor?: boolean;

    @IsOptional()
    @IsNumber()
    parent_org_id?: number | null;

}

