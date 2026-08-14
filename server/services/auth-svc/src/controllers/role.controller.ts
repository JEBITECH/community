import { Request, Response } from "express";
import { Body, Get, JsonController, Param, Post, Put, Res, UseBefore } from "routing-controllers";
import { ActionService } from "../services/action.service";
import { ActionDto } from "../dto/action.dto";
import { RoleService } from "../services/role.service";
import { RolesDto } from "../dto/roles.dto";
import { ResponseSchema } from "routing-controllers-openapi";
import { RolesListDto } from "../dto/rolelist.dto";
import { RoleResDto } from "../dto/roleresdto";


@JsonController('/auth/roles')
export class RoleController {

    private roleService: RoleService;
    constructor() {
        this.roleService = new RoleService();
    }
    @Post()
    async addRole(@Body() dto: RolesDto, @Res() res: Response) {
        try {
            const role = await this.roleService.create(dto);
            if (role) {
                return res.status(201).json({
                    message: ' Role Added successfully',

                });
            }
            else {
                return res.status(201).json({
                    message: 'Role Not Added, Please give valid Organization Id',

                });
            }
        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Role Not Added, Please give valid Organization Id'
            });
        }
    }

    @Get()
    @ResponseSchema(RolesListDto)
    async findAllRoles(@Res() res: Response) {
        try {
            const roleList = await this.roleService.getAllRoles();
            return res.status(201).json(roleList);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    @Get('/:organization_id')
    @ResponseSchema(RolesListDto)
    async findOrganizationById(@Param("organization_id") id: number, @Res() res: Response) {
        try {
            const roleList = await this.roleService.getRoleByOrganizationId(id);
            if (!roleList) {
                return res.status(404).json({ message: "Not Found" });
            }
            return res.status(200).json(roleList);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    
    @Put('/:id')
    async updateRoleById(@Param('id') id: number, @Body() dto: RolesDto, @Res() res: Response) {
        try {

            const role = await this.roleService.updateRoleById(id, dto);
            return res.status(201).json(role);

        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }




}