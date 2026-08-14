import { Response } from "express";
import { Body, Get, JsonController, Param, Post, Put, QueryParam, Res } from "routing-controllers";
import { ModuleService } from "../services/module.service";
import { ModuleDto } from "../dto/module.dto";
import { ResponseSchema } from "routing-controllers-openapi";
import { ModuleListDto } from "../dto/modulelist.dto";

@JsonController('/auth/modules')
export class ModuleController {

    private moduleService: ModuleService;
    constructor() {
        this.moduleService = new ModuleService();
    }
    @Post()
    async AddModule(@Body() dto: ModuleDto, @Res() res: Response) {
        try {
            const newModule = await this.moduleService.create(dto);
            if (newModule) {
                return res.status(201).json({
                    message: ' Module Added successfully',

                });
            }
            else {
                return res.status(201).json({
                    message: 'Module Not Added',

                });
            }
        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Module cannot be add'
            });
        }
    }

    @Get()
    @ResponseSchema(ModuleListDto)
    async getAllModules(@Res() res: Response, @QueryParam('include_internal') includeInternal?: string) {
        try {
            const moduleList = await this.moduleService.findAllModules(includeInternal === 'true');
            return res.status(201).json(moduleList);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    @Put('/:id')
    async updateModuleById(@Param('id') id: number, @Body() dto: ModuleDto, @Res() res: Response) {
        try {
            const module = await this.moduleService.updateModuleById(id, dto);
            return res.status(201).json(module);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }


}