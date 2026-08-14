import { IsBoolean, IsNumber, IsString } from "class-validator";

export class RoleResDto {

    @IsNumber()
    role_id?: number;
    @IsString()
    name: string;

    @IsBoolean()
    status?: boolean;

    @IsNumber()
    organization_id?: number;
}