import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class ActionDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @IsOptional()
    @IsNumber()
    module_id?: number;
}