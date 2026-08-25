import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { ModuleEntity, OrganizationModuleSubscription, Theme } from "@shared/entities";

export class OrganizationDetailDto {

    @IsNumber()
    organization_id!: number;

    @IsString()
    organization_name!: string;

    @IsOptional()
    @IsString()
    organization_email?: string;

    @IsOptional()
    @IsString()
    organization_location?: string;

    @IsOptional()
    @IsString()
    organization_timezone?: string;

    @IsOptional()
    @IsString()
    organization_contact_info?: string;

    @IsOptional()
    @IsString()
    organization_logo?: string;

    @IsString()
    organization_type!: string;

    @IsString()
    subdomain!: string;

    @IsString()
    plan!: string;

    @IsString()
    membership_model!: string;

    @IsString()
    organization_status!: string;

    @IsBoolean()
    is_archived!: boolean;

    @IsOptional()
    @IsString()
    super_admin_id?: string;

    @IsOptional()
    @IsString()
    super_admin_name?: string;

    @IsOptional()
    @IsString()
    super_admin_email?: string;

    @IsOptional()
    @IsString()
    super_admin_phone?: string;

    @IsArray()
    modules!: ModuleEntity[];

    @IsArray()
    moduleSubscriptions!: { module_id: number; term: string; price: number; startDate: string; endDate: string }[];

    @IsOptional()
    themeConfig?: Theme;
}

export class OrganizationListDto {
    @IsArray()
    organization_list!: OrganizationDetailDto[];

    @IsString()
    message!: string;
}
