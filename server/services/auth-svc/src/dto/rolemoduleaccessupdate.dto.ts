import { IsBoolean, IsNumber } from "class-validator";

export class RoleModuleAccessUpdateDto {
    @IsNumber()
    role_id?: number;

    @IsNumber()
    organization_id?: number;

    @IsNumber()
    module_id?: number;

    @IsNumber()
    action_id?: number;

    @IsNumber()
    sub_action_id?: number;

    @IsBoolean()
    is_access?: boolean;

}