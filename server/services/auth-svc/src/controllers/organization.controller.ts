import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { Body, Delete, Get, HttpCode, JsonController, Param, Patch, Post, Req, Res, UseBefore } from "routing-controllers";
import { OrganizationDto } from "../dto/organization.dto";
import { ResponseSchema } from "routing-controllers-openapi";
import { OrganizationPmsListDto } from "../dto/organizationpmslist.dto";
import { OrganizationDetailDto } from "../dto/organizationdetail.dto";
import { FranchiseListDto } from "../dto/franchise-list.dto";
import { authMiddleware } from "../middlewares/authMiddleware";
import { Paginate, PaginateQuery } from "@shared/common";
// import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";

@JsonController('/auth/organizations')
export class OrganizationController {

    private organizationService: OrganizationService;
    constructor() {
        this.organizationService = new OrganizationService();
    }
    @Post()
    async create(@Body() dto: OrganizationDto, @Res() res: Response) {
        try {
            const result = await this.organizationService.create(dto);
            return res.status(201).json({
                message: 'Organization , User created and invited successfully',
                user: result
            });
        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Organization cannot be add'
            });
        }
    }

    @Get('/check-email/:email')
    async checkEmailUnique(@Param('email') email: string, @Res() res: Response) {
        try {
            const isUnique = await this.organizationService.isEmailUnique(email);
            return res.status(200).json({
                email,
                isUnique
            });
        } catch (err) {
            return res.status(400).json({
                error: err instanceof Error ? err.message : 'Cannot check email uniqueness'
            });
        }
    }

    @Get()
    @ResponseSchema(OrganizationPmsListDto)
    async findAllOrganization(@Req() req: Request, @Res() res: Response) {
        try {
            const user = JSON.parse(req.headers['x-user'] as string);
            const organizationList = await this.organizationService.getAllOrganization(user);
            return res.status(201).json(organizationList);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    @Get('/franchises/:franchisor_id')
    @ResponseSchema(FranchiseListDto)
    async getFranchiseesByFranchisorId(
        @Param('franchisor_id') franchisorId: number,
        @Paginate query: PaginateQuery,
        @Res() res: Response,
    ) {
        try {
            const result = await this.organizationService.getFranchiseesByFranchisorId(franchisorId, query);
            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to fetch franchisees' });
        }
    }

    @Get('/:id')
    @ResponseSchema(OrganizationDetailDto)
    async findOrganizationById(@Param("id") id: number, @Res() res: Response) {
        try {
            const organization = await this.organizationService.getOrganizationById(id);
            if (!organization) {
                return res.status(404).json({ message: "Not Found" });
            }
            return res.status(200).json(organization);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }


    @Get('/properties/:id')
    async findPropertiesByOrganizationId(@Param("id") id: number, @Res() res: Response) {
        try {
            const organization = await this.organizationService.getPropertiesByOrganizationId(id);
            if (!organization) {
                return res.status(404).json({ message: "Not Found" });
            }
            return res.status(200).json(organization);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    @Patch('/:id')
    async updateOrganizationById(@Param('id') id: number, @Body() dto: OrganizationDto, @Res() res: Response) {
        try {
            const organization = await this.organizationService.updateOrganizationById(id, dto);
            return res.status(201).json(organization);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    
    @Delete('/:id')
    async deleteOrganizationById(@Param('id') id: number, @Res() res: Response) {
        try {
            const organization = await this.organizationService.deleteOrganization(id);
            return res.status(201).json({
                message: 'Organization , User created and invited successfully',
                organization:organization
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    @Patch('/restore/:id')
    async restoreOrganizationById(@Param('id') id: number, @Res() res: Response) {
        try {
            const organization = await this.organizationService.restoreOrganization(id);
            return res.status(201).json({
                message: 'Organization restored successfully',
                organization:organization
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    @Get('/modules-by-Organization/:id')
    @ResponseSchema(OrganizationDetailDto)
    async findModulesByOrganizationId(@Param("id") id: number, @Res() res: Response) {
        try {
            const moduleList = await this.organizationService.getModulesByOrganizationId(id);
            if (!moduleList) {
                return res.status(404).json({ message: "Not Found" });
            }
            return res.status(200).json(moduleList);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}