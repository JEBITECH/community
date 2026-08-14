import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class RolesDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @IsOptional()
    @IsNumber()
    organization_id?: number;
}