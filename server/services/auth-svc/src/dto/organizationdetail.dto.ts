import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";
import { PmsMasterDetailDto } from "./pmsdetail.dto";

export class OrganizationDetailDto {

    @IsNumber()
    organization_id?: number;

    @IsString()
    organization_name?: string;

    @IsString()
    organization_email?: string;

    @IsString()
    organization_location?: string;

    @IsArray()
    pms_master: PmsMasterDetailDto[]

}
