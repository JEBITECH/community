import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class SubActionListDto {


    @IsOptional()
    @IsNumber()
    sub_Action_id?: number | null;

    @IsOptional()
    @IsString()
    name?: string | null;

    @IsOptional()
    @IsBoolean()
    status?: boolean;


}