import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ModuleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}