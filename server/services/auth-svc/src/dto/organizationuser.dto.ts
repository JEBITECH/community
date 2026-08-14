import { IsNumber, IsOptional, IsString } from "class-validator";

export class OrganizationUserDto {

    @IsString()
    first_name?: string;

    @IsString()
    last_name?: string;

    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    new_email?: string;

    @IsNumber()
    organization_id?: number;

    @IsString()
    user_role?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    password?: string;
}