import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class PmsMasterDto {

    @IsNumber()
    pms_id?: number;

    @IsBoolean()
    is_archived?: boolean;

    @IsString()
    pms_name?: string;

    @IsOptional()
    @IsString()
    client_id?: string;

    @IsOptional()
    @IsString()
    pms_client_secret?: string;

    @IsOptional()
    @IsString()
    client_name?: string;

    @IsOptional()
    @IsString()
    api_key?: string;

    @IsString()
    pms_location?: string;

    @IsString()
    pms_account?: string;

    @IsString()
    pms_url?: string;

}