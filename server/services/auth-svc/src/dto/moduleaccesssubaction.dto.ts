import { IsNumber, IsOptional } from "class-validator";

export class ModuleAccessSubActionDto {
    @IsOptional()
    @IsNumber()
    sub_action_id?: number | null;


}