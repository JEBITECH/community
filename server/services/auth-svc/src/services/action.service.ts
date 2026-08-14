import { Repository } from "typeorm";
import { AppDataSource } from "../db";
import { Action } from "../entity/action.model";
import { ActionDto } from "../dto/action.dto";
import { ModuleEntity } from "@shared/entities";

export class ActionService {
    private actionRepo: Repository<Action>;
    private moduleRepo: Repository<ModuleEntity>;


    constructor() {
        this.actionRepo = AppDataSource.getRepository(Action);
        this.moduleRepo = AppDataSource.getRepository(ModuleEntity);

    }
    async create(actionDto: ActionDto): Promise<Action> {
        const module = await this.moduleRepo.findOne({ where: { id: actionDto.module_id } });
        if (module) {
            const action = this.actionRepo.create({
                name: actionDto.name,
                status: actionDto.status,
                module_id: actionDto.module_id
            });
            return await this.actionRepo.save(action);
        }


    }

    async updateActionById(id: number, dto: ActionDto): Promise<Action> {

        const action = await this.actionRepo.findOne({ where: { id } });
        if (!action) {
            throw new Error(`action with id ${id} not found`);
        }
        this.actionRepo.merge(action, dto);


        return await this.actionRepo.save(action);
    }
}