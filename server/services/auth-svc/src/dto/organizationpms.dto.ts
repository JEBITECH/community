import { IsArray, IsBoolean, IsObject, IsString } from "class-validator";
import { PmsListDto } from "./pmslist.dto";
import { ModuleDto } from "./module.dto";
import { ThemeConfigDto } from "./themeConfig.dto";
import { OrganizationModuleSubscriptionDto } from "./OrganizationModuleSubscription.dto";
import { PropertyLocation } from "../entity/proeprty-location";


export class OrganizationPmsDto {

    @IsString()
    organization_id: number;

    @IsBoolean()
    is_archived?: boolean;

    @IsString()
    organization_name?: string;

    @IsString()
    organization_email?: string;

    @IsString()
    organization_location?: string;

    @IsString()
    organization_timezone?: string;

    @IsString()
    organization_contact_info?: string;

    @IsArray()
    organization_property_locations?: PropertyLocation[];

    @IsString()
    super_admin_id?: number | string;

    @IsString()
    super_admin_name?: string;

    @IsString()
    super_admin_email?: string;

    @IsString()
    super_admin_phone?: string;

    @IsString()
    super_admin_role?: string;

    @IsArray()
    pms_list?: PmsListDto[];

    @IsString()
    no_of_pms?: number;

    @IsArray()
    modules: ModuleDto[];

    @IsArray()
    moduleSubscriptions: OrganizationModuleSubscriptionDto[]

    @IsObject()
    themeConfig?: ThemeConfigDto

    @IsString()
    organization_logo?: string;

    @IsBoolean()
    is_franchisor?: boolean;

    @IsString()
    parent_org_id?: number | null;
}