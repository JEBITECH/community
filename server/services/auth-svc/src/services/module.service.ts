import { Repository } from "typeorm";
import { AppDataSource } from "../db";
import { ModuleDto } from "../dto/module.dto";
import { ModuleListDto } from "../dto/modulelist.dto";
import { ModuleResDto } from "../dto/moduleres.dto";
import { Action } from "../entity/action.model";
import { ActionListDto } from "../dto/actionlist.dto";
import { SubAction } from "../entity/subaction.model";
import { SubActionListDto } from "../dto/subactionlist.dto";
import { ModuleEntity as Module } from "@shared/entities";

export class ModuleService {
    private moduleRepo: Repository<Module>;
    private actionRepo: Repository<Action>;
    private subActionRepo: Repository<SubAction>;


    constructor() {
        this.moduleRepo = AppDataSource.getRepository(Module);
        this.actionRepo = AppDataSource.getRepository(Action);
        this.subActionRepo = AppDataSource.getRepository(SubAction);

    }
    async create(moduleDto: ModuleDto): Promise<Module> {
        const module = this.moduleRepo.create({
            name: moduleDto.name,
            status: moduleDto.status
        });
        return await this.moduleRepo.save(module);
    }


    async findAllModules(includeInternal: boolean = false): Promise<ModuleListDto> {

        const moduleList = includeInternal
            ? await this.moduleRepo.find()
            : await this.moduleRepo.find({ where: { is_internal: false } });
        const allModule = new ModuleListDto();
        const moduleResponselist: ModuleResDto[] = []

        for (const module of moduleList) {
            const moduleDto = new ModuleResDto();
            moduleDto.module_id = module.id;
            moduleDto.name = module.name;
            moduleDto.status = module.status;
            moduleDto.is_internal = module.is_internal ?? false;
            const actionlist = await this.actionRepo.find({ where: { module_id: module.id } });
            console.log('action list :', actionlist);
            const actionDtoList: ActionListDto[] = [];
            for (const action of actionlist) {
                const actionDto = new ActionListDto();
                actionDto.action_id = action.id;
                actionDto.name = action.name;
                actionDto.status = action.status;

                const subActionList = await this.subActionRepo.find({ where: { action_id: action.id } });
                console.log('sub action list :', subActionList);
                const subActionDtoList: SubActionListDto[] = [];
                for (const subAction of subActionList) {
                    const subActionDto = new SubActionListDto();
                    subActionDto.sub_Action_id = subAction.id;
                    subActionDto.name = subAction.name;
                    subActionDto.status = subAction.status;
                    subActionDtoList.push(subActionDto);
                }
                actionDto.sub_action_list = subActionDtoList;
                actionDtoList.push(actionDto);
            }
            moduleDto.action_list = actionDtoList;
            moduleResponselist.push(moduleDto);

        }
        allModule.module_list = moduleResponselist;
        return allModule;


    }

    async updateModuleById(id: number, dto: ModuleDto): Promise<Module> {

        const module = await this.moduleRepo.findOne({ where: { id } });
        if (!module) {
            throw new Error(`module with id ${id} not found`);
        }
        this.moduleRepo.merge(module, dto);


        return await this.moduleRepo.save(module);
    }
}