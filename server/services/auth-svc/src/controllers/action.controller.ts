import { Request, Response } from "express";
import { Body, JsonController, Param, Post, Put, Res, UseBefore } from "routing-controllers";
import { ActionService } from "../services/action.service";
import { ActionDto } from "../dto/action.dto";


@JsonController('/auth/action')
export class ActionController {

    private actionService: ActionService;
    constructor() {
        this.actionService = new ActionService();
    }
    @Post()
    async AddAction(@Body() dto: ActionDto, @Res() res: Response) {
        try {
            const action = await this.actionService.create(dto);
            if (action) {
                return res.status(201).json({
                    message: ' Action Added successfully',

                });
            }
            else {
                return res.status(201).json({
                    message: 'Action Not Added, Please give valid module Id',

                });
            }
        } catch (error) {
            return res.status(400).json({
                error: error instanceof Error ? error.message : 'Action Not Added, Please give valid module Id'
            });
        }
    }

    @Put('/:id')
    async updateActionById(@Param('id') id: number, @Body() dto: ActionDto, @Res() res: Response) {
        try {

            const action = await this.actionService.updateActionById(id, dto);
            return res.status(201).json(action);

        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}