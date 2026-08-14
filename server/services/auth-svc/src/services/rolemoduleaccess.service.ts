import { Repository } from "typeorm";
import { Roles } from "../entity/roles.model";
import { AppDataSource } from "../db";
import { RoleModuleAccess } from "../entity/rolemoduleaccess.model";
import { RoleModuleAccessDto } from "../dto/rolemoduleaccess.dto";

import { ModuleResDto } from "../dto/moduleres.dto";
import { RoleResDto } from "../dto/roleresdto";
import { ModuleListDto } from "../dto/modulelist.dto";
import { Action } from "../entity/action.model";
import { SubAction } from "../entity/subaction.model";
import { ActionListDto } from "../dto/actionlist.dto";
import { SubActionDto } from "../dto/subaction.dto";
import { SubActionListDto } from "../dto/subactionlist.dto";
import { ModuleEntity, Organization } from "@shared/entities";

export class RoleModuleAccessService {
    private roleRepo: Repository<Roles>;
    private OrganizationRepo: Repository<Organization>;
    private roleModuleAccessRepo: Repository<RoleModuleAccess>;
    private moduleRepo: Repository<ModuleEntity>;
    private actionRepo: Repository<Action>;
    private subActionRepo: Repository<SubAction>;


    constructor() {
        this.roleRepo = AppDataSource.getRepository(Roles);
        this.OrganizationRepo = AppDataSource.getRepository(Organization);
        this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
        this.moduleRepo = AppDataSource.getRepository(ModuleEntity);
        this.actionRepo = AppDataSource.getRepository(Action);
        this.subActionRepo = AppDataSource.getRepository(SubAction);

    }
   async create(dto: RoleModuleAccessDto): Promise<{ status: boolean, message: string }> {
    // 1. Fetch all existing entries for this role+organization  
    const existingAccessList = await this.roleModuleAccessRepo.find({
        where: {
            organization_id: dto.organization_id,
            role_id: dto.role_id
        }
    });

    // 2. Build a Set of submitted keys (module-action-subaction)
    const submittedKeys = new Set<string>();
    const entriesToInsert: RoleModuleAccess[] = [];

    for (const module of dto.assign_modules) {
        for (const action of module.action_list) {
            for (const subAction of action.sub_action_list) {
                const key = `${module.module_id}-${action.action_id}-${subAction.sub_action_id}`;
                submittedKeys.add(key);

                const existingEntry = existingAccessList.find(
                    e =>
                        e.module_id === module.module_id &&
                        e.action_id === action.action_id &&
                        e.sub_action_id === subAction.sub_action_id
                );

                if (!existingEntry) {
                    const newEntry = this.roleModuleAccessRepo.create({
                        organization_id: dto.organization_id,
                        role_id: dto.role_id,
                        module_id: module.module_id,
                        action_id: action.action_id,
                        sub_action_id: subAction.sub_action_id,
                        is_access: true
                    });
                    entriesToInsert.push(newEntry);
                }
            }
        }
    }

    // 3. Find entries that MUST be deleted (because user unchecked them)
    const entriesToDelete = existingAccessList.filter(existing => {
        const key = `${existing.module_id}-${existing.action_id}-${existing.sub_action_id}`;
        return !submittedKeys.has(key);
    });

    // 4. Perform insert + delete operations
    if (entriesToDelete.length > 0) {
        await this.roleModuleAccessRepo.remove(entriesToDelete);
    }

    if (entriesToInsert.length > 0) {
        await this.roleModuleAccessRepo.save(entriesToInsert);
    }

    return {
        status: true,
        message: "Role module access updated successfully"
    };
}


    async getModuleByOrgIdAndRoleId(organizationId: number, roleId: number): Promise<ModuleListDto> {
        const moduleAccessList = await this.roleModuleAccessRepo.find({
            where: { organization_id: organizationId, role_id: roleId, is_access: true },
            relations: ['module', 'action', 'sub_action'],
        });

        const moduleListDto = new ModuleListDto();
        const moduleResList = await this.prepareModuleData(moduleAccessList);

        // Internal modules (is_internal: true) are always shown in the ACL UI so admins
        // can grant access to them. However, when a module has no role_module_access rows
        // (e.g. after the admin removes all permissions), buildInternalModulesDtos() would
        // normally return every sub-action from the sub_action table, causing the UI to
        // show them as pre-selected. Strip sub_action_list here so the structure is present
        // but nothing appears selected until the admin explicitly saves a permission.
        const internalModules = await this.buildInternalModulesDtos();
        const existingModuleIds = new Set(moduleResList.map(m => m.module_id));
        const internalToAppend = internalModules
            .filter(m => !existingModuleIds.has(m.module_id))
            .map(m => ({
                ...m,
                action_list: m.action_list.map(a => ({ ...a, sub_action_list: [] })),
            }));
        moduleListDto.module_list = [...moduleResList, ...internalToAppend];

        return moduleListDto;
    }

    async buildInternalModulesDtos(): Promise<ModuleResDto[]> {
        const internalModules = await this.moduleRepo.find({
            where: { is_internal: true, status: true },
        });

        const result: ModuleResDto[] = [];

        for (const module of internalModules) {
            const moduleDto = new ModuleResDto();
            moduleDto.module_id = module.id;
            moduleDto.name = module.name;
            moduleDto.status = true;
            moduleDto.is_internal = true;

            const actions = await this.actionRepo.find({ where: { module_id: module.id } });
            const actionList: ActionListDto[] = [];

            for (const action of actions) {
                const actionDto = new ActionListDto();
                actionDto.action_id = action.id;
                actionDto.name = action.name;
                actionDto.status = true;

                const subActions = await this.subActionRepo.find({ where: { action_id: action.id } });
                actionDto.sub_action_list = subActions.map(sa => {
                    const sub = new SubActionListDto();
                    sub.sub_Action_id = sa.id;
                    sub.name = sa.name;
                    sub.status = true;
                    return sub;
                });

                actionList.push(actionDto);
            }

            moduleDto.action_list = actionList;
            result.push(moduleDto);
        }

        return result;
    }

async prepareModuleData(moduleAccessList: RoleModuleAccess[]): Promise<ModuleResDto[]> {
    const moduleGroup = moduleAccessList.reduce((acc, moduleAccess) => {
        if (!acc[moduleAccess.module_id]) {
            acc[moduleAccess.module_id] = [];
        }
        acc[moduleAccess.module_id].push(moduleAccess);
        return acc;
    }, {} as Record<number, RoleModuleAccess[]>);

    const moduleResList: ModuleResDto[] = [];

    for (const moduleId in moduleGroup) {
        const firstModuleAccess = moduleGroup[moduleId][0];
        if (!firstModuleAccess.module) continue;

        const moduleDto = new ModuleResDto();
        moduleDto.module_id = firstModuleAccess.module.id;
        moduleDto.name = firstModuleAccess.module.name;
        // Set status to true since we only fetch records with is_access: true
        moduleDto.status = true;

        // If all records for this module have null action_id it was granted at module level
        const allNullActions = moduleGroup[moduleId].every(ma => !ma.action);
        if (allNullActions) {
            moduleDto.action_list = [];
            moduleResList.push(moduleDto);
            continue;
        }

        // Group actions
        const actionGroup = moduleGroup[moduleId].reduce((acc, actionAccess) => {
            if (!actionAccess.action) return acc;
            if (!acc[actionAccess.action_id]) {
                acc[actionAccess.action_id] = [];
            }
            acc[actionAccess.action_id].push(actionAccess);
            return acc;
        }, {} as Record<number, RoleModuleAccess[]>);

        const actionList: ActionListDto[] = [];

        for (const actionId in actionGroup) {
            const firstActionAccess = actionGroup[actionId][0];
            if (!firstActionAccess.action) continue;

            const actionDto = new ActionListDto();
            actionDto.action_id = firstActionAccess.action.id;
            actionDto.name = firstActionAccess.action.name;
            // Set status to true since we only fetch records with is_access: true
            actionDto.status = true;

            const uniqueSubActionIds = new Set<number>();
            const subActionList: SubActionListDto[] = [];
            // null sub_action means access was granted at action level (no sub-action granularity).
            // Collect that signal separately; only emit a null DTO if no specific sub-actions exist.
            let hasNullSubAction = false;
            for (const subActionAccess of actionGroup[actionId]) {
                if (!subActionAccess.sub_action) {
                    hasNullSubAction = true;
                    continue;
                }

                if (!uniqueSubActionIds.has(subActionAccess.sub_action.id)) {
                    uniqueSubActionIds.add(subActionAccess.sub_action.id);

                    const subActionDto = new SubActionListDto();
                    subActionDto.sub_Action_id = subActionAccess.sub_action.id;
                    subActionDto.name = subActionAccess.sub_action.name;
                    subActionDto.status = true;
                    subActionList.push(subActionDto);
                }
            }

            // Only emit a null/"full access" entry when there are NO specific sub-actions.
            // If both coexist (stale null row + real rows), the specific ones take priority.
            if (hasNullSubAction && subActionList.length === 0) {
                const subActionDto = new SubActionListDto();
                subActionDto.sub_Action_id = null;
                subActionDto.name = null;
                subActionDto.status = true;
                subActionList.push(subActionDto);
            }

            actionDto.sub_action_list = subActionList;
            actionList.push(actionDto);
        }

        moduleDto.action_list = actionList;
        moduleResList.push(moduleDto);
    }

    return moduleResList;
}
}
