import { IsArray, IsNumber } from "class-validator";
import { ModuleAccessSubActionDto } from "./moduleaccesssubaction.dto";

export class ModuleAccessActionDto {
    @IsNumber()
    action_id?: number;

    @IsArray()
    sub_action_list?: ModuleAccessSubActionDto[]
}