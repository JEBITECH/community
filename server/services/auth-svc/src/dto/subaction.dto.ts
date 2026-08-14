import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class SubActionDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @IsOptional()
    @IsNumber()
    module_id?: number;

    @IsOptional()
    @IsNumber()
    action_id?: number
}