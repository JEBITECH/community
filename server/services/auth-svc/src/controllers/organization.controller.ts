import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { Body, Get, JsonController, Param, Patch, Post, Req, Res } from "routing-controllers";
import { OrganizationDto } from "../dto/organization.dto";
import { ResponseSchema } from "routing-controllers-openapi";
import { OrganizationListDto, OrganizationDetailDto } from "../dto/organizationdetail.dto";

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
            if (!result.status) {
                return res.status(400).json({ error: result.message });
            }
            return res.status(201).json(result);
        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Organization could not be created'
            });
        }
    }

    @Get('/check-subdomain/:subdomain')
    async checkSubdomainUnique(@Param('subdomain') subdomain: string, @Res() res: Response) {
        try {
            const isUnique = await this.organizationService.checkSubdomainUnique(subdomain);
            return res.status(200).json({ subdomain, isUnique });
        } catch (err) {
            return res.status(400).json({
                error: err instanceof Error ? err.message : 'Cannot check subdomain availability'
            });
        }
    }

    @Get('/by-subdomain/:subdomain')
    async findOrganizationBySubdomain(@Param('subdomain') subdomain: string, @Res() res: Response) {
        try {
            const organization = await this.organizationService.getOrganizationBySubdomain(subdomain);
            return res.status(200).json(organization);
        } catch (err) {
            return res.status(404).json({ error: err instanceof Error ? err.message : 'Organization not found' });
        }
    }

    @Get()
    @ResponseSchema(OrganizationListDto)
    async findAllOrganization(@Req() req: Request, @Res() res: Response) {
        try {
            const headerUser = req.headers['x-user'];
            const user = headerUser ? JSON.parse(headerUser as string) : (req as any).user;
            const organizationList = await this.organizationService.getAllOrganization(user);
            return res.status(200).json(organizationList);
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to fetch organizations' });
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
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to fetch organization' });
        }
    }

    @Patch('/:id')
    async updateOrganizationById(@Param('id') id: number, @Body() dto: OrganizationDto, @Res() res: Response) {
        try {
            const organization = await this.organizationService.updateOrganizationById(id, dto);
            return res.status(200).json(organization);
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update organization' });
        }
    }

    @Patch('/:id/suspend')
    async suspendOrganization(@Param('id') id: number, @Res() res: Response) {
        try {
            const result = await this.organizationService.suspendOrganization(id);
            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to suspend organization' });
        }
    }

    @Patch('/:id/reactivate')
    async reactivateOrganization(@Param('id') id: number, @Res() res: Response) {
        try {
            const result = await this.organizationService.reactivateOrganization(id);
            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to reactivate organization' });
        }
    }

    @Patch('/archive/:id')
    async deleteOrganizationById(@Param('id') id: number, @Res() res: Response) {
        try {
            const organization = await this.organizationService.deleteOrganization(id);
            return res.status(200).json({
                message: 'Organization archived successfully',
                organization,
            });
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to archive organization' });
        }
    }

    @Patch('/restore/:id')
    async restoreOrganizationById(@Param('id') id: number, @Res() res: Response) {
        try {
            const organization = await this.organizationService.restoreOrganization(id);
            return res.status(200).json({
                message: 'Organization restored successfully',
                organization,
            });
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to restore organization' });
        }
    }

    @Get('/modules-by-Organization/:id')
    async findModulesByOrganizationId(@Param("id") id: number, @Res() res: Response) {
        try {
            const moduleList = await this.organizationService.getModulesByOrganizationId(id);
            if (!moduleList) {
                return res.status(404).json({ message: "Not Found" });
            }
            return res.status(200).json(moduleList);
        } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to fetch modules' });
        }
    }
}
