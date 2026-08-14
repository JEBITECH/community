import { IsArray, IsString, } from "class-validator";
import { OrganizationPmsDto } from "./organizationpms.dto";
export class OrganizationPmsListDto {

    @IsString()
    message?: string;

    @IsArray()
    organization_list?: OrganizationPmsDto[]
}