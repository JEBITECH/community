import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { ModuleResDto } from "./moduleres.dto";
import { RoleModuleAccessUpdateDto } from "./rolemoduleaccessupdate.dto";
import { Type } from "class-transformer";
import { ReservationDetailsDto, TaskTypesDto, UnitDetailsDto } from "@shared/entities";

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

    @IsString()
    @IsOptional()
    owner_type?: string;

    @IsBoolean()
    @IsOptional()
    is_task_view?: boolean;

    @IsBoolean()
    @IsOptional()
    is_reservation_view?: boolean;

    @IsBoolean()
    @IsOptional()
    is_unit_view?: boolean;

    @IsBoolean()
    @IsOptional()
    is_document_view?: boolean;

    @IsBoolean()
    @IsOptional()
    is_graph_view?: boolean;

    @IsNumber()
    @IsOptional()
    cost_per_hour?: number;

    @IsNumber()
    @IsOptional()
    cost_per_month?: number;

    @IsBoolean()
    @IsOptional()
    include_trip_cost?: boolean;

    @IsNumber()
    @IsOptional()
    cost_per_km?: number;

    @IsString()
    @IsOptional()
    company_identification_number?: string;

    @IsString()
    @IsOptional()
    tax_number?: string;

    @IsString()
    @IsOptional()
    freefield1?: string;

    @IsString()
    @IsOptional()
    freefield2?: string;

    @IsOptional()
    owner_details?: any;

    @IsArray()
    @IsOptional()
    module_list?: RoleModuleAccessUpdateDto[]

    @IsArray()
    @IsOptional()
    unitIds?: number[];

    @IsArray()
    @IsOptional()
    propertyIds?: number[];

    docs?: any[];

    @IsOptional()
    @Type(() => TaskTypesDto)
    task_types?: TaskTypesDto;

    @IsOptional()
    @Type(() => ReservationDetailsDto)
    reservation_details?: ReservationDetailsDto;

    @IsOptional()
    @Type(() => UnitDetailsDto)
    unit_types?: UnitDetailsDto;

    @IsArray()
    @IsOptional()
    location_coordinate?: number[];

    @IsArray()
    @IsOptional()
    location_coordinate_end?: number[];
}