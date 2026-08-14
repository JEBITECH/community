import { Repository } from "typeorm";
import { AppDataSource } from "../db";
import { ModuleDto } from "../dto/module.dto";
import { ModuleListDto } from "../dto/modulelist.dto";
import { ModuleResDto } from "../dto/moduleres.dto";
import { Action } from "../entity/action.model";
import { SubAction } from "../entity/subaction.model";
import { SubActionDto } from "../dto/subaction.dto";
import { ModuleEntity } from "@shared/entities";
import { RoleModuleAccess } from "../entity/rolemoduleaccess.model";

export class SubActionService {
    private subActionRepo: Repository<SubAction>;
    private moduleRepo: Repository<ModuleEntity>;
    private actionRepo: Repository<Action>;
    private roleModuleAccessRepo: Repository<RoleModuleAccess>;

    constructor() {
        this.subActionRepo = AppDataSource.getRepository(SubAction);
        this.moduleRepo = AppDataSource.getRepository(ModuleEntity);
        this.actionRepo = AppDataSource.getRepository(Action);
        this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
    }
    async create(subActionDto: SubActionDto): Promise<SubAction> {
        const module = await this.moduleRepo.findOne({ where: { id: subActionDto.module_id } });
        const action = await this.actionRepo.findOne({ where: { id: subActionDto.action_id } })
        if (module && action) {
            const subAction = this.subActionRepo.create({
                name: subActionDto.name,
                status: subActionDto.status,
                module_id: subActionDto.module_id,
                action_id: subActionDto.action_id
            });


            return await this.subActionRepo.save(subAction);
        }

    }
    async updateSubActionById(id: number, dto: SubActionDto): Promise<SubAction> {
        const subAction = await this.subActionRepo.findOne({ where: { id } });
        if (!subAction) {
            throw new Error(`subAction with id ${id} not found`);
        }

        if (dto.status === false && subAction.status !== false) {
            const accessEntries = await this.roleModuleAccessRepo.find({ where: { sub_action_id: id } });
            if (accessEntries.length > 0) {
                await this.roleModuleAccessRepo.remove(accessEntries);
            }
        }

        this.subActionRepo.merge(subAction, dto);
        return await this.subActionRepo.save(subAction);
    }
}