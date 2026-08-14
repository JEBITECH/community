import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { ActionListDto } from "./actionlist.dto";

export class ModuleResDto {

    @IsNumber()
    @IsOptional()
    module_id?: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    status?: boolean;

    @IsBoolean()
    @IsOptional()
    is_internal?: boolean;

    @IsArray()
    @IsOptional()
    action_list?: ActionListDto[];
}