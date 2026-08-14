import { IsAlpha, IsArray, IsBoolean, IsNumber, IsString } from "class-validator";
import { ActionListDto } from "./actionlist.dto";
import { ModuleAccessActionDto } from "./moduleacessaction.dto";

export class ModuleAccessResDto {

    @IsNumber()
    module_id?: number;

    @IsArray()
    action_list?: ModuleAccessActionDto[];
}