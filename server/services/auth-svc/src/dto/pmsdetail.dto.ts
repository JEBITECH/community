import { IsNumber, IsString } from "class-validator";

export class PmsMasterDetailDto {

    @IsNumber()
    pms_id?: number;

    @IsString()
    pms_name?: string;

    @IsString()
    client_id?: string;

    @IsString()
    pms_client_secret?: string;

    @IsString()
    pms_location?: string;

    @IsString()
    pms_account?: string;

}