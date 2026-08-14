import { IsArray, IsString } from "class-validator";
import { ModuleResDto } from "./moduleres.dto";

export class ModuleListDto {

    @IsArray()
    module_list?: ModuleResDto[]
}