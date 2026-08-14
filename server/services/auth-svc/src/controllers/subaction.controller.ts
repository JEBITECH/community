import { Request, Response } from "express";
import { Body, JsonController, Param, Post, Put, Res, UseBefore } from "routing-controllers";
import { ActionService } from "../services/action.service";
import { ActionDto } from "../dto/action.dto";
import { SubActionService } from "../services/subaction.service";
import { SubActionDto } from "../dto/subaction.dto";

@JsonController('/auth/sub-action')
export class SubActionController {

    private subActionService: SubActionService;
    constructor() {
        this.subActionService = new SubActionService();
    }
    @Post()
    async addSubAction(@Body() dto: SubActionDto, @Res() res: Response) {
        try {
            const SubAction = await this.subActionService.create(dto);
            if (SubAction) {
                return res.status(201).json({
                    message: ' Sub-Action Added successfully',

                });
            }
            else {
                return res.status(201).json({
                    message: 'Sub-Action Not Added, Please give valid module Id, Action Id',

                });
            }
        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Sub-Action Not Added, Please give valid module Id, Action Id'
            });
        }
    }


    @Put('/:id')
    async updateActionById(@Param('id') id: number, @Body() dto: SubActionDto, @Res() res: Response) {
        try {

            const subAction = await this.subActionService.updateSubActionById(id, dto);
            return res.status(201).json(subAction);

        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}