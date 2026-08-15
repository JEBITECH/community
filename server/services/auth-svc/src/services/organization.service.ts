import { In, Not, Repository } from "typeorm";
import { AppDataSource } from "../db";
import { OrganizationDto } from "../dto/organization.dto";
import * as crypto from 'crypto';
import { RoleModuleAccessService } from "./rolemoduleaccess.service";
import { ModuleListDto } from "../dto/modulelist.dto";
import { Action } from "../entity/action.model";
import {
  Organization,
  OrganizationModuleSubscription,
  Theme,
  User,
  Membership,
  ModuleEntity as Module,
} from "@shared/entities";
import { Role } from "@shared/common";
import { NotificationBootstrapService } from "./notification-bootstrap.service";
import { Roles } from "../entity/roles.model";
import { SubAction } from "../entity/subaction.model";
import { RoleModuleAccess } from "../entity/rolemoduleaccess.model";
import { OrganizationDetailDto, OrganizationListDto } from "../dto/organizationdetail.dto";
import { EmailService } from "./email.service";

/**
 * Modules that are technically `is_internal` (always-on, not part of the
 * optional module-subscription toggle set) but are platform-level, not
 * org-level — they must never be auto-granted to an org's own super_admin,
 * only ever usable by Master Admin (who bypasses the ACL grid entirely).
 */
const PLATFORM_ONLY_MODULE_NAMES = ["Platform Dashboard", "Organizations"];

export class OrganizationService {
    private organizationRepo: Repository<Organization>;
    private userRepo: Repository<User>;
    private membershipRepo: Repository<Membership>;
    private moduleRepo: Repository<Module>;
    private themeRepo: Repository<Theme>;
    private roleModuleAccessRepo: Repository<RoleModuleAccess>;
    private roleModuleAccessService: RoleModuleAccessService;
    private roleRepo: Repository<Roles>;
    private notificationBootstrapService: NotificationBootstrapService;
    private moduleSubscriptionRepo: Repository<OrganizationModuleSubscription>;
    private actionRepo: Repository<Action>;
    private subActionRepo: Repository<SubAction>;
    private emailService: EmailService;

    constructor() {
        this.organizationRepo = AppDataSource.getRepository(Organization);
        this.userRepo = AppDataSource.getRepository(User);
        this.membershipRepo = AppDataSource.getRepository(Membership);
        this.themeRepo = AppDataSource.getRepository(Theme);
        this.moduleSubscriptionRepo = AppDataSource.getRepository(OrganizationModuleSubscription);
        this.roleModuleAccessService = new RoleModuleAccessService();
        this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
        this.moduleRepo = AppDataSource.getRepository(Module);
        this.actionRepo = AppDataSource.getRepository(Action);
        this.subActionRepo = AppDataSource.getRepository(SubAction);
        this.roleRepo = AppDataSource.getRepository(Roles);
        this.notificationBootstrapService = new NotificationBootstrapService();
        this.emailService = new EmailService();
    }

    /**
     * Onboards a new organization: creates the org + theme, its default
     * SUPER_ADMIN role/permissions, the primary admin user + membership, and
     * seeds default module access — all inside one transaction so a failure
     * partway through (e.g. duplicate subdomain, notification outage) never
     * leaves a half-configured organization behind. The invite email is sent
     * only after the transaction commits.
     */
    async create(organizationDto: OrganizationDto): Promise<{ status: boolean; message: string; organizationId?: number }> {
        const { subdomain, super_admin } = organizationDto;

        if (!subdomain) {
            return { status: false, message: 'subdomain is required' };
        }

        const existingSubdomain = await this.organizationRepo.findOne({ where: { subdomain } });
        if (existingSubdomain) {
            return { status: false, message: 'An organization with this subdomain already exists' };
        }

        if (super_admin?.email) {
            const existingUser = await this.userRepo.findOne({ where: { email: super_admin.email } });
            if (existingUser) {
                return { status: false, message: 'User with this email already exists' };
            }
        }

        let organizationId: number;
        let adminUser: User | undefined;

        try {
            await AppDataSource.transaction(async (manager) => {
                const timezone = organizationDto.organization_timezone
                    || Intl.DateTimeFormat().resolvedOptions().timeZone
                    || 'UTC';

                const organization = manager.create(Organization, {
                    organization_name: organizationDto.organization_name,
                    organization_email: organizationDto.organization_email?.trim() || '',
                    organization_location: organizationDto.organization_location || '',
                    organization_timezone: timezone,
                    organization_contact_info: organizationDto.organization_contact_info || '',
                    organization_type: (organizationDto.organization_type as any) || 'society',
                    subdomain,
                    membership_model: (organizationDto.membership_model as any) || 'approval_required',
                    organization_logo: organizationDto.organization_logo || null,
                    organization_status: 'active',
                });
                const savedOrganization = await manager.save(organization);
                organizationId = savedOrganization.id;

                if (organizationDto.themeConfig) {
                    const theme = manager.create(Theme, {
                        primary_color: organizationDto.themeConfig.primary_color,
                        secondary_color: organizationDto.themeConfig.secondary_color,
                        font_family: organizationDto.themeConfig.font_family,
                    });
                    const savedTheme = await manager.save(theme);
                    savedOrganization.themeConfig = savedTheme;
                    await manager.save(savedOrganization);
                }

                // Default org-scoped roles
                const superAdminRole = await manager.save(manager.create(Roles, {
                    name: Role.SUPER_ADMIN,
                    status: true,
                    organization_id: organizationId,
                }));
                const coreCommitteeRole = await manager.save(manager.create(Roles, {
                    name: Role.CORE_COMMITTEE,
                    status: true,
                    organization_id: organizationId,
                }));

                if (super_admin?.email) {
                    adminUser = manager.create(User, {
                        firstName: super_admin.first_name,
                        lastName: super_admin.last_name,
                        email: super_admin.email,
                        phone: super_admin.phone,
                        password: super_admin.password || crypto.randomBytes(16).toString('hex'),
                        role: Role.SUPER_ADMIN,
                        roleId: superAdminRole.id,
                        isActive: false,
                        emailVerificationToken: crypto.randomBytes(32).toString('hex'),
                        emailVerificationExpires: new Date(Date.now() + parseInt(process.env.INVITE_TOKEN_EXPIRY_MINUTES || '480', 10) * 60 * 1000),
                    });
                    adminUser = await manager.save(adminUser);

                    await manager.save(manager.create(Membership, {
                        user_id: adminUser.id!,
                        organization_id: organizationId,
                        role: Role.SUPER_ADMIN,
                        roleId: superAdminRole.id,
                        member_type: 'internal',
                        status: 'active',
                        joined_at: new Date(),
                        is_default: true,
                    }));
                }

                // Module selection + ACL seeding
                const moduleIds = organizationDto.module_ids || [];
                if (moduleIds.length > 0) {
                    const moduleEntities = await manager.find(Module, { where: { id: In(moduleIds) } });
                    savedOrganization.modules = moduleEntities;
                    await manager.save(savedOrganization);
                }

                // Super admin gets full access to every selected module + every internal
                // org-level module — but never platform-only modules (Platform Dashboard,
                // Organizations), which stay exclusive to Master Admin.
                const internalModules = await manager.find(Module, {
                    where: { is_internal: true, status: true, name: Not(In(PLATFORM_ONLY_MODULE_NAMES)) },
                });
                const allModuleIds = [...new Set([...moduleIds, ...internalModules.map(m => m.id!)])];
                await this.grantFullModuleAccess(manager, organizationId, superAdminRole.id, allModuleIds);

                // Core committee gets a reduced operational module set (only from the org's selected/enabled modules).
                const coreCommitteeModuleNames = ['Events', 'Bookings', 'Donations', 'Sponsorship', 'Volunteer', 'Comments', 'Attendance', 'Members', 'Dashboard'];
                const coreCommitteeModules = await manager.find(Module, { where: { id: In(moduleIds.length ? moduleIds : []), name: In(coreCommitteeModuleNames) } });
                if (coreCommitteeModules.length > 0) {
                    await this.grantFullModuleAccess(manager, organizationId, coreCommitteeRole.id, coreCommitteeModules.map(m => m.id!));
                }

                if (organizationDto.module_subscriptions?.length) {
                    const subs: OrganizationModuleSubscription[] = [];
                    for (const subDto of organizationDto.module_subscriptions) {
                        const module = await manager.findOne(Module, { where: { id: subDto.module_id } });
                        if (!module) continue;
                        subs.push(manager.create(OrganizationModuleSubscription, {
                            organization: savedOrganization,
                            module,
                            term: subDto.term,
                            price: subDto.price,
                            startDate: subDto.startDate || new Date().toISOString().split('T')[0],
                            endDate: subDto.endDate || new Date().toISOString().split('T')[0],
                        }));
                    }
                    if (subs.length) await manager.save(subs);
                }
            });
        } catch (err) {
            console.error('[OrganizationService] create failed:', err);
            return { status: false, message: err instanceof Error ? err.message : 'Failed to create organization' };
        }

        // Fire-and-forget, after commit: never let a notification outage roll back org creation.
        if (adminUser) {
            this.notificationBootstrapService.bootstrapCompanyPreference({ organizationId: organizationId! }).catch(() => {});
            this.notificationBootstrapService.bootstrapUserPreference({ userId: adminUser.id!, organizationId: organizationId! }).catch(() => {});
            this.emailService.sendInviteEmail(adminUser.email!, adminUser.emailVerificationToken!).catch((err) => {
                console.error('[OrganizationService] Failed to send invite email:', err instanceof Error ? err.message : err);
            });
        }

        return { status: true, message: 'Organization created successfully', organizationId: organizationId! };
    }

    /** Grants full (module + every action) access for a role across the given modules. */
    private async grantFullModuleAccess(manager: typeof AppDataSource.manager, organizationId: number, roleId: number, moduleIds: number[]): Promise<void> {
        if (moduleIds.length === 0) return;

        const entries: Partial<RoleModuleAccess>[] = [];
        const actions = await manager.find(Action, { where: { module_id: In(moduleIds) } });
        const actionsByModule = actions.reduce((acc, action) => {
            (acc[action.module_id] ||= []).push(action);
            return acc;
        }, {} as Record<number, Action[]>);

        for (const moduleId of moduleIds) {
            entries.push({ organization_id: organizationId, role_id: roleId, module_id: moduleId, is_access: true });
            for (const action of actionsByModule[moduleId] || []) {
                entries.push({ organization_id: organizationId, role_id: roleId, module_id: moduleId, action_id: action.id, is_access: true });
            }
        }

        await manager.save(RoleModuleAccess, entries);
    }

    async checkSubdomainUnique(subdomain: string): Promise<boolean> {
        const existing = await this.organizationRepo.findOne({ where: { subdomain } });
        return !existing;
    }

    /**
     * Public, unauthenticated lookup used by the join-community flow and guest
     * landing pages — deliberately returns only branding/policy fields, never
     * admin/contact/PMS-adjacent data.
     */
    async getOrganizationBySubdomain(subdomain: string) {
        const organization = await this.organizationRepo.findOne({
            where: { subdomain, is_archived: false },
            relations: ['themeConfig'],
        });
        if (!organization || organization.organization_status !== 'active') {
            throw new Error('Organization not found');
        }

        return {
            organization_id: organization.id,
            organization_name: organization.organization_name,
            organization_type: organization.organization_type,
            organization_logo: organization.organization_logo,
            membership_model: organization.membership_model,
            subdomain: organization.subdomain,
            themeConfig: organization.themeConfig,
        };
    }

    async getAllOrganization(currentUser?: any): Promise<OrganizationListDto> {
        const isMaster = !currentUser || currentUser.role === Role.MASTER_ADMIN;
        const orgWhere = isMaster ? {} : { id: currentUser.organization_id };

        const organizationList = await this.organizationRepo.find({
            where: orgWhere,
            order: { id: 'DESC' },
            relations: ['modules', 'themeConfig', 'moduleSubscriptions'],
        });

        const result = new OrganizationListDto();
        result.organization_list = await Promise.all(organizationList.map((org) => this.toDetailDto(org)));
        result.message = 'fetch successfully';
        return result;
    }

    async getOrganizationById(organizationId: number): Promise<OrganizationDetailDto> {
        const organization = await this.organizationRepo.findOne({
            where: { id: organizationId, is_archived: false },
            relations: ['modules', 'themeConfig', 'moduleSubscriptions'],
        });

        if (!organization) {
            throw new Error(`Organization with id ${organizationId} not found`);
        }

        return this.toDetailDto(organization);
    }

    private async toDetailDto(organization: Organization): Promise<OrganizationDetailDto> {
        const superAdminMembership = await this.membershipRepo.findOne({
            where: { organization_id: organization.id, role: Role.SUPER_ADMIN, status: 'active' },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });

        const dto = new OrganizationDetailDto();
        dto.organization_id = organization.id;
        dto.organization_name = organization.organization_name;
        dto.organization_email = organization.organization_email;
        dto.organization_location = organization.organization_location;
        dto.organization_timezone = organization.organization_timezone || '';
        dto.organization_contact_info = organization.organization_contact_info || '';
        dto.organization_logo = organization.organization_logo || '';
        dto.organization_type = organization.organization_type;
        dto.subdomain = organization.subdomain;
        dto.plan = organization.plan;
        dto.membership_model = organization.membership_model;
        dto.organization_status = organization.organization_status;
        dto.is_archived = organization.is_archived;
        dto.super_admin_id = superAdminMembership?.user?.id;
        dto.super_admin_name = superAdminMembership?.user ? superAdminMembership.user.firstName : '';
        dto.super_admin_email = superAdminMembership?.user?.email || '';
        dto.super_admin_phone = superAdminMembership?.user?.phone || '';
        dto.modules = organization.modules;
        dto.moduleSubscriptions = (organization.moduleSubscriptions || []).map((sub) => ({
            module_id: sub.module.id!,
            term: sub.term,
            price: sub.price,
            startDate: sub.startDate,
            endDate: sub.endDate,
        }));
        dto.themeConfig = organization.themeConfig;
        return dto;
    }

    async getModulesByOrganizationId(id: number): Promise<ModuleListDto> {
        const organization = await this.organizationRepo.findOne({ where: { id } });
        if (!organization) {
            return undefined as any;
        }

        const moduleAccessList = await this.roleModuleAccessRepo
            .createQueryBuilder('role_module_access')
            .leftJoinAndSelect('role_module_access.module', 'module')
            .leftJoinAndSelect('role_module_access.action', 'action')
            .leftJoinAndSelect('role_module_access.sub_action', 'sub_action')
            .distinctOn(['module_id', 'action_id', 'sub_action_id'])
            .where('organization_id = :id', { id })
            .andWhere('is_access = :status', { status: true })
            .getMany();

        const moduleResList = await this.roleModuleAccessService.prepareModuleData(moduleAccessList);
        const internalModules = await this.roleModuleAccessService.buildInternalModulesDtos();
        const existingModuleIds = new Set(moduleResList.map(m => m.module_id));
        const internalToAppend = internalModules.filter(m => !existingModuleIds.has(m.module_id));

        const moduleListDto = new ModuleListDto();
        moduleListDto.module_list = [...moduleResList, ...internalToAppend];
        return moduleListDto;
    }

    async updateOrganizationById(organizationId: number, dto: OrganizationDto): Promise<Organization> {
        const organization = await this.organizationRepo.findOne({
            where: { id: organizationId, is_archived: false },
            relations: ['modules', 'themeConfig'],
        });

        if (!organization) throw new Error('Organization not found');

        if (dto.subdomain && dto.subdomain !== organization.subdomain) {
            const clash = await this.organizationRepo.findOne({ where: { subdomain: dto.subdomain } });
            if (clash) throw new Error('An organization with this subdomain already exists');
            organization.subdomain = dto.subdomain;
        }

        organization.organization_name = dto.organization_name ?? organization.organization_name;
        organization.organization_email = dto.organization_email ?? organization.organization_email;
        organization.organization_location = dto.organization_location ?? organization.organization_location;
        organization.organization_timezone = dto.organization_timezone ?? organization.organization_timezone;
        organization.organization_contact_info = dto.organization_contact_info ?? organization.organization_contact_info;
        if (dto.organization_type !== undefined) organization.organization_type = dto.organization_type as any;
        if (dto.membership_model !== undefined) organization.membership_model = dto.membership_model as any;
        if (dto.organization_logo !== undefined) organization.organization_logo = dto.organization_logo;

        await this.organizationRepo.save(organization);

        if (dto.module_ids?.length !== undefined) {
            const previousModuleIds = organization.modules?.map(m => m.id!) || [];
            const newModuleIds = dto.module_ids || [];

            organization.modules = newModuleIds.length > 0
                ? await this.moduleRepo.findBy({ id: In(newModuleIds) })
                : [];
            await this.organizationRepo.save(organization);

            await this.syncRoleModuleAccess(organizationId, previousModuleIds, newModuleIds);

            const orgRoles = await this.roleRepo.find({ where: { organization_id: organizationId } });
            for (const orgRole of orgRoles) {
                await this.assignInternalModulesToOrg(organizationId, orgRole.id);
            }
        }

        if (dto.module_subscriptions?.length !== undefined) {
            const existingSubs = await this.moduleSubscriptionRepo.find({
                where: { organization: { id: organizationId } },
                relations: ['module'],
            });
            const incomingModuleIds = dto.module_subscriptions.map(sub => sub.module_id);
            const moduleSubsToSave: OrganizationModuleSubscription[] = [];

            for (const subDto of dto.module_subscriptions) {
                const module = await this.moduleRepo.findOne({ where: { id: subDto.module_id } });
                if (!module) continue;

                const existingSub = existingSubs.find(sub => sub.module.id === module.id);
                if (existingSub) {
                    existingSub.term = subDto.term;
                    existingSub.price = subDto.price;
                    existingSub.startDate = subDto.startDate || new Date().toISOString().split('T')[0];
                    existingSub.endDate = subDto.endDate || new Date().toISOString().split('T')[0];
                    moduleSubsToSave.push(existingSub);
                } else {
                    moduleSubsToSave.push(this.moduleSubscriptionRepo.create({
                        organization,
                        module,
                        term: subDto.term,
                        price: subDto.price,
                        startDate: subDto.startDate || new Date().toISOString().split('T')[0],
                        endDate: subDto.endDate || new Date().toISOString().split('T')[0],
                    }));
                }
            }

            const subsToDelete = existingSubs.filter(sub => !incomingModuleIds.includes(sub.module.id!));
            if (subsToDelete.length > 0) await this.moduleSubscriptionRepo.remove(subsToDelete);
            if (moduleSubsToSave.length > 0) await this.moduleSubscriptionRepo.save(moduleSubsToSave);
        }

        if (dto.themeConfig) {
            if (organization.themeConfig) {
                const theme = organization.themeConfig;
                theme.primary_color = dto.themeConfig.primary_color ?? theme.primary_color;
                theme.secondary_color = dto.themeConfig.secondary_color ?? theme.secondary_color;
                theme.font_family = dto.themeConfig.font_family ?? theme.font_family;
                await this.themeRepo.save(theme);
            } else {
                const newTheme = this.themeRepo.create({ ...dto.themeConfig, organization });
                await this.themeRepo.save(newTheme);
                organization.themeConfig = newTheme;
                await this.organizationRepo.save(organization);
            }
        }

        return this.organizationRepo.findOne({
            where: { id: organization.id },
            relations: ['modules', 'themeConfig'],
        }) as Promise<Organization>;
    }

    private async syncRoleModuleAccess(organizationId: number, previousModuleIds: number[], newModuleIds: number[]): Promise<void> {
        const addedModules = newModuleIds.filter(id => !previousModuleIds.includes(id));
        const removedModules = previousModuleIds.filter(id => !newModuleIds.includes(id));
        const roles = await this.roleRepo.find({ where: { organization_id: organizationId } });

        for (const role of roles) {
            if (removedModules.length > 0) {
                await this.roleModuleAccessRepo
                    .createQueryBuilder()
                    .delete()
                    .from(RoleModuleAccess)
                    .where('organization_id = :orgId', { orgId: organizationId })
                    .andWhere('role_id = :roleId', { roleId: role.id })
                    .andWhere('module_id IN (:...moduleIds)', { moduleIds: removedModules })
                    .execute();
            }

            if (addedModules.length > 0) {
                const existingAccesses = await this.roleModuleAccessRepo
                    .createQueryBuilder('rma')
                    .select('DISTINCT rma.module_id', 'module_id')
                    .where('rma.organization_id = :orgId', { orgId: organizationId })
                    .andWhere('rma.role_id = :roleId', { roleId: role.id })
                    .andWhere('rma.module_id IN (:...moduleIds)', { moduleIds: addedModules })
                    .getRawMany();

                const existingModuleIds = existingAccesses.map(access => access.module_id);
                const modulesToAdd = addedModules.filter(moduleId => !existingModuleIds.includes(moduleId));
                await this.createComprehensiveRoleModuleAccess(organizationId, role.id, modulesToAdd);
            }
        }
    }

    private async createComprehensiveRoleModuleAccess(organizationId: number, roleId: number, moduleIds: number[]): Promise<void> {
        if (moduleIds.length === 0) return;

        const roleAccessEntities: RoleModuleAccess[] = [];
        const modules = await this.moduleRepo.find({ where: { id: In(moduleIds) } });
        const actions = await this.actionRepo.find({ where: { module_id: In(moduleIds) } });
        const actionIds = actions.map(action => action.id);
        const subActions = actionIds.length > 0 ? await this.subActionRepo.find({ where: { action_id: In(actionIds) } }) : [];

        const actionsByModule = actions.reduce((acc, action) => {
            if (!acc[action.module_id]) acc[action.module_id] = [];
            acc[action.module_id].push(action);
            return acc;
        }, {} as Record<number, Action[]>);

        const subActionsByAction = subActions.reduce((acc, subAction) => {
            if (!acc[subAction.action_id]) acc[subAction.action_id] = [];
            acc[subAction.action_id].push(subAction);
            return acc;
        }, {} as Record<number, SubAction[]>);

        for (const module of modules) {
            roleAccessEntities.push(this.roleModuleAccessRepo.create({
                organization_id: organizationId, role_id: roleId, module_id: module.id, is_access: true,
            }));

            for (const action of actionsByModule[module.id!] || []) {
                roleAccessEntities.push(this.roleModuleAccessRepo.create({
                    organization_id: organizationId, role_id: roleId, module_id: module.id, action_id: action.id, is_access: true,
                }));

                for (const subAction of subActionsByAction[action.id] || []) {
                    roleAccessEntities.push(this.roleModuleAccessRepo.create({
                        organization_id: organizationId, role_id: roleId, module_id: module.id, action_id: action.id, sub_action_id: subAction.id, is_access: true,
                    }));
                }
            }
        }

        if (roleAccessEntities.length > 0) {
            await this.roleModuleAccessRepo.save(roleAccessEntities);
        }
    }

    /**
     * Assigns all internal modules to the given org+role in role_module_access.
     * Idempotent — skips any module that already has access entries.
     */
    private async assignInternalModulesToOrg(organizationId: number, roleId: number): Promise<void> {
        const internalModules = await this.moduleRepo.find({
            where: { is_internal: true, status: true, name: Not(In(PLATFORM_ONLY_MODULE_NAMES)) },
        });
        if (internalModules.length === 0) return;

        const existingAccesses = await this.roleModuleAccessRepo
            .createQueryBuilder('rma')
            .select('DISTINCT rma.module_id', 'module_id')
            .where('rma.organization_id = :orgId', { orgId: organizationId })
            .andWhere('rma.role_id = :roleId', { roleId })
            .andWhere('rma.module_id IN (:...moduleIds)', { moduleIds: internalModules.map(m => m.id) })
            .getRawMany();

        const existingModuleIds = existingAccesses.map(a => Number(a.module_id));
        const missingModuleIds = internalModules.map(m => m.id!).filter(id => !existingModuleIds.includes(id));

        if (missingModuleIds.length > 0) {
            await this.createComprehensiveRoleModuleAccess(organizationId, roleId, missingModuleIds);
        }
    }

    async suspendOrganization(organizationId: number): Promise<{ status: boolean; message: string }> {
        const organization = await this.organizationRepo.findOne({ where: { id: organizationId } });
        if (!organization) throw new Error('Organization not found');
        organization.organization_status = 'suspended';
        await this.organizationRepo.save(organization);
        return { status: true, message: 'Organization suspended' };
    }

    async reactivateOrganization(organizationId: number): Promise<{ status: boolean; message: string }> {
        const organization = await this.organizationRepo.findOne({ where: { id: organizationId } });
        if (!organization) throw new Error('Organization not found');
        organization.organization_status = 'active';
        await this.organizationRepo.save(organization);
        return { status: true, message: 'Organization reactivated' };
    }

    async deleteOrganization(organizationId: number) {
        const organization = await this.organizationRepo.findOne({ where: { id: organizationId } });
        if (!organization) throw new Error('Organization not found');
        if (organization.is_archived) return { message: 'Organization already archived' };
        organization.is_archived = true;
        return this.organizationRepo.save(organization);
    }

    async restoreOrganization(organizationId: number) {
        const organization = await this.organizationRepo.findOne({ where: { id: organizationId } });
        if (!organization) throw new Error('Organization not found');
        if (!organization.is_archived) return { message: 'Organization already restored' };
        organization.is_archived = false;
        return this.organizationRepo.save(organization);
    }
}
