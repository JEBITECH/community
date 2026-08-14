import { IsArray, IsNumber } from "class-validator";
import { ModuleResDto } from "./moduleres.dto";
import { ModuleAccessResDto } from "./moduleaccessres.dto";

export class RoleModuleAccessDto {
    @IsNumber()
    role_id?: number;

    @IsNumber()
    organization_id?: number;

    @IsArray()
    assign_modules?: ModuleAccessResDto[];
}