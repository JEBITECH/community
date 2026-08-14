import { IsArray, IsString } from "class-validator";
import { RolesDto } from "./roles.dto";
import { RoleResDto } from "./roleresdto";

export class RolesListDto {

    @IsArray()
    role_list?: RoleResDto[]
}