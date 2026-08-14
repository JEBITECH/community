import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { SubActionListDto } from "./subactionlist.dto";

export class ActionListDto {

    @IsNumber()
    @IsOptional()
    action_id?: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    status?: boolean;

    @IsArray()
    @IsOptional()
    sub_action_list?: SubActionListDto[]


}