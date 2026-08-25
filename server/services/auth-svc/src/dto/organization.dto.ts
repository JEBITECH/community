import { IsString, IsArray, IsObject, IsOptional, ValidateNested, IsIn, MaxLength } from 'class-validator'
import { OrganizationUserDto } from "./organizationuser.dto";
import { Type } from "class-transformer";
import { ThemeConfigDto } from "./themeConfig.dto";
import { OrganizationModuleSubscriptionDto } from "./OrganizationModuleSubscription.dto";

export class OrganizationDto {

    @IsString()
    @MaxLength(50)
    organization_name?: string;

    @IsOptional()
    @IsString()
    organization_email?: string;

    @IsOptional()
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

    @IsOptional()
    @IsIn(['society', 'educational_institution'])
    organization_type?: string;

    @IsOptional()
    @IsString()
    @MaxLength(63)
    subdomain?: string;

    @IsOptional()
    @IsIn(['open', 'approval_required', 'invite_only'])
    membership_model?: string;

    @IsOptional()
    @IsIn(['free', 'community', 'professional', 'enterprise'])
    plan?: string;

    @IsOptional()
    @IsObject()
    super_admin?: OrganizationUserDto;

    @IsOptional()
    @IsArray()
    module_ids?: number[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrganizationModuleSubscriptionDto)
    module_subscriptions?: OrganizationModuleSubscriptionDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => ThemeConfigDto)
    themeConfig?: ThemeConfigDto;

    @IsOptional()
    @IsString()
    organization_logo?: string;

}
