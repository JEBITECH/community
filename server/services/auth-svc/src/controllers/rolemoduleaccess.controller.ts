import { Body, Get, JsonController, Param, Post, Res, UseBefore } from "routing-controllers";
import { RoleService } from "../services/role.service";
import { RolesDto } from "../dto/roles.dto";
import { Request, Response } from "express";
import { RoleModuleAccessDto } from "../dto/rolemoduleaccess.dto";
import { RoleModuleAccessService } from "../services/rolemoduleaccess.service";
import { ResponseSchema } from "routing-controllers-openapi";
import { ModuleListDto } from "../dto/modulelist.dto";

@JsonController('/auth/role-module-access')
export class RoleModuleAccessController {

    private rolemoduleAccessService: RoleModuleAccessService;
    constructor() {
        this.rolemoduleAccessService = new RoleModuleAccessService();
    }
    @Post()
    async addRoleModuleAccess(@Body() dto: RoleModuleAccessDto, @Res() res: Response) {
        try {
            const role = await this.rolemoduleAccessService.create(dto);

            return res.status(role.status ? 201 : 200).json(role);

        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Role Not Added, Please give valid Organization Id, Module Id'
            });
        }
    }

    @Get('/:organizationId/:roleId')
    @ResponseSchema(ModuleListDto)
    async findModuleByOrgIdAndRoleId(@Param('organizationId') organizationId: number,
        @Param('roleId') roleId: number, @Res() res: Response) {
        try {
            const moduleList = await this.rolemoduleAccessService.getModuleByOrgIdAndRoleId(organizationId, roleId);
            return res.status(201).json(moduleList);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}