import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { RoleModuleAccessUpdateDto } from "./rolemoduleaccessupdate.dto";

export class UserUpdateDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    dob?: string;

    @IsString()
    @IsOptional()
    role?: string;

    @IsNumber()
    @IsOptional()
    roleId?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    external_user?: boolean;

    @IsArray()
    @IsOptional()
    module_list?: RoleModuleAccessUpdateDto[]

    docs?: any[];
}
