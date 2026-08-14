import { In, Repository } from "typeorm";
import { AppDataSource } from "../db";
import { OrganizationDto } from "../dto/organization.dto";
import { OrganizationPmsDto } from "../dto/organizationpms.dto";
import { OrganizationPmsListDto } from "../dto/organizationpmslist.dto";
import { PmsListDto } from "../dto/pmslist.dto";
import nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import axios from 'axios';
import { RoleModuleAccessService } from "./rolemoduleaccess.service";
import { ModuleListDto } from "../dto/modulelist.dto";
import { PMS_CONFIGS } from '../utils/config/pms.config';
import { Action } from "../entity/action.model";
import { PmsDto } from "../dto/pms.dto";
import { Organization, OrganizationModuleSubscription, PmsConfig, PmsMaster, Theme, User, ModuleEntity as Module, AuthType } from "@shared/entities";
import { RoleService } from "./role.service";
import { NotificationBootstrapService } from "./notification-bootstrap.service";
import { Roles } from "../entity/roles.model";
import { SubAction } from "../entity/subaction.model";
import { RoleModuleAccess } from "../entity/rolemoduleaccess.model";
import { FranchiseItemDto } from "../dto/franchise-item.dto";
import { FranchiseListDto } from "../dto/franchise-list.dto";
import { PaginateQuery } from "@shared/common";

export class OrganizationService {
    private organizationRepo: Repository<Organization>;
    private pmsMasterRepo: Repository<PmsMaster>;
    private userRepo: Repository<User>;
    private moduleRepo: Repository<Module>;
    private themeRepo: Repository<Theme>;
    private roleModuleAccessRepo: Repository<RoleModuleAccess>;
    private roleModuleAccessService: RoleModuleAccessService;
    private pmsConfigRepo: Repository<PmsConfig>;
    private roleRepo: Repository<Roles>;
    private roleService: RoleService;
    private notificationBootstrapService: NotificationBootstrapService;
    private moduleSubscriptionRepo: Repository<OrganizationModuleSubscription>;
    private actionRepo: Repository<Action>;
    private subActionRepo: Repository<SubAction>


    constructor() {
        this.organizationRepo = AppDataSource.getRepository(Organization);
        this.pmsMasterRepo = AppDataSource.getRepository(PmsMaster);
        this.userRepo = AppDataSource.getRepository(User);
        this.themeRepo = AppDataSource.getRepository(Theme);
        this.pmsConfigRepo = AppDataSource.getRepository(PmsConfig); this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess)
        this.moduleSubscriptionRepo = AppDataSource.getRepository(OrganizationModuleSubscription);
        this.roleModuleAccessService = new RoleModuleAccessService();
        this.roleService = new RoleService();
        this.notificationBootstrapService = new NotificationBootstrapService();
        this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
        this.moduleRepo = AppDataSource.getRepository(Module);
        this.actionRepo = AppDataSource.getRepository(Action);
        this.subActionRepo = AppDataSource.getRepository(SubAction);
        this.roleRepo = AppDataSource.getRepository(Roles);

    }

    async create(organizationDto: OrganizationDto): Promise<{ status: boolean, message: string }> {
        try {
            const existingUser = await this.userRepo.findOne({ where: { email: organizationDto.super_admin.email } });
            const existingOrganization = await this.organizationRepo.findOne({ where: { organization_email: organizationDto.organization_email.trim() } });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            else if (existingOrganization) {
                throw new Error('Organization with this email already exists');
            }
            else {
                const { organization_name, organization_email, organization_location, organization_timezone, organization_contact_info, organization_property_locations, organization_logo, is_franchisor, parent_org_id } = organizationDto;
                const timezone = organization_timezone
                    || Intl.DateTimeFormat().resolvedOptions().timeZone
                    || 'UTC';
                const contact_info = organization_contact_info || "";
                const propertyLocations = organization_property_locations || [];
                const organization = this.organizationRepo.create({
                    organization_name: organization_name,
                    organization_email: organization_email.trim() || null,
                    organization_location: organization_location,
                    organization_timezone: timezone,
                    organization_contact_info: contact_info,
                    organization_property_locations: propertyLocations,
                    organization_logo: organization_logo || null,
                    is_franchisor: is_franchisor ?? false,
                    parent_org_id: parent_org_id ?? null,
                });

                const saveOrganization = await this.organizationRepo.save(organization);
                const organizationId = saveOrganization.id;
                const roleOfOrganization = await this.roleRepo.findOne({ where: { organization_id: organizationId } });
                let role;
                if (!roleOfOrganization) {
                    role = this.roleRepo.create({
                        name: organizationDto.super_admin.user_role,
                        status: true,
                        organization_id: organizationId
                    });
                    await this.roleRepo.save(role);
                }
                const user = this.userRepo.create({
                    firstName: organizationDto.super_admin.first_name,
                    lastName: organizationDto.super_admin.last_name,
                    email: organizationDto.super_admin.email,
                    phone: organizationDto.super_admin.phone,
                    password: organizationDto.super_admin.password,
                    role: organizationDto.super_admin.user_role,
                    organization_id: organizationId,
                    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
                    emailVerificationExpires: new Date(Date.now() + parseInt(process.env.INVITE_TOKEN_EXPIRY_MINUTES || '480', 10) * 60 * 1000)
                });

                await this.userRepo.save(user);
                try {
                    await this.sendInviteEmail(user.email, user.emailVerificationToken);
                } catch (emailErr) {
                    console.error('[OrganizationService] Failed to send invite email:', emailErr.message);
                    // Non-fatal: continue org creation even if email fails
                }

                const orgRole = roleOfOrganization ?? role;
                await Promise.all([
                    this.notificationBootstrapService.bootstrapCompanyPreference({
                        organizationId,
                    }),
                    this.notificationBootstrapService.bootstrapRolePreference({
                        organizationId,
                        role: 'super_admin',
                        roleId: orgRole?.id ?? null,
                    }),
                    this.notificationBootstrapService.bootstrapRolePreference({
                        organizationId,
                        role: 'manager',
                    }),
                    this.notificationBootstrapService.bootstrapUserPreference({
                        organizationId,
                        userId: user.id,
                        timezone: timezone,
                    }),
                ]);

                const pmsMasterList: PmsMaster[] = [];
                const pmsConfigList: PmsConfig[] = [];
                for (const pmsMaster of organizationDto.pms_master) {
                    const pms: PmsMaster = this.pmsMasterRepo.create({
                        organization_id: organizationId,
                        pms_name: pmsMaster.pms_name,
                        pms_account: pmsMaster.pms_account,
                        pms_location: pmsMaster.pms_location,
                        pms_url: pmsMaster.pms_url
                    })

                    //saving it individually so that we can retrieve the pms id to add it in pms config
                    const savedPms = await this.pmsMasterRepo.save(pms);
                    pmsMasterList.push(savedPms);
                    // get data from the pms_config
                    const staticConfig = PMS_CONFIGS[pmsMaster.pms_name?.toLowerCase()];
                    if (staticConfig) {
                        let configEntity;
                        if (pmsMaster.pms_name == 'dharma') {
                            configEntity = this.pmsConfigRepo.create({
                                organization_id: organizationId,
                                pms_id: savedPms.id,
                                baseUrl: staticConfig.baseUrl,
                                authType: AuthType.APIKEY,
                                authUrl: staticConfig.authUrl,
                                apiKey: '73de46d3-12ec-4447-aca6-6158ddf3f4fb',
                                endpoints: staticConfig.endpoints,
                                fields: staticConfig.fields,
                            });
                        } else {
                            configEntity = this.pmsConfigRepo.create({
                                organization_id: organizationId,
                                pms_id: savedPms.id,
                                baseUrl: staticConfig.baseUrl,
                                authType: staticConfig?.authType,
                                authUrl: staticConfig.authUrl,
                                credentials: {
                                    client_id: pmsMaster.client_id,
                                    client_secret: pmsMaster.pms_client_secret,
                                    client_name:pmsMaster?.client_name == "" ? null : pmsMaster?.client_name
                                },
                                endpoints: staticConfig.endpoints,
                                fields: staticConfig.fields,
                            });
                        }
                        pmsConfigList.push(configEntity);
                    }

                }

                if (organizationDto?.module_ids?.length > 0) {
                    const moduleEntities = [];
                    const roleAccessEntities: RoleModuleAccess[] = [];



                    for (const moduleId of organizationDto.module_ids) {
                        const module = await this.moduleRepo.findOne({ where: { id: moduleId } });
                        if (!module) {
                            continue;
                        }
                        moduleEntities.push(module);

                        // Module-level access
                        roleAccessEntities.push(this.roleModuleAccessRepo.create({
                            organization_id: organizationId,
                            role_id: orgRole!.id,
                            module_id: module.id,
                            is_access: true,
                        }));

                        // Get actions for this module
                        const actions = await this.actionRepo.find({ where: { module_id: module.id } });

                        for (const action of actions) {
                            // Action-level access
                            roleAccessEntities.push(this.roleModuleAccessRepo.create({
                                organization_id: organizationId,
                                module_id: module.id,
                                role_id: orgRole!.id,
                                action_id: action.id,
                                is_access: true,
                            }));

                            // Get sub-actions for this action
                            const subActions = await this.subActionRepo.find({ where: { action_id: action.id } });

                            for (const subAction of subActions) {
                                // SubAction-level access
                                roleAccessEntities.push(this.roleModuleAccessRepo.create({
                                    organization_id: organizationId,
                                    module_id: module.id,
                                    role_id: orgRole!.id,
                                    action_id: action.id,
                                    sub_action_id: subAction.id,
                                    is_access: true,
                                }));
                            }
                        }
                    }

                    // Save all RoleModuleAccess entries
                    await this.roleModuleAccessRepo.save(roleAccessEntities);

                    // Save modules in organization
                    saveOrganization.modules = moduleEntities;
                    await this.organizationRepo.save(saveOrganization);
                }

                // Always assign internal modules to the org's default role
                if (orgRole?.id) {
                    await this.assignInternalModulesToOrg(organizationId, orgRole.id);
                }

                if (organizationDto?.module_subscriptions?.length > 0) {
                    let moduleSubs: OrganizationModuleSubscription[] = [];
                    for (const subDto of organizationDto.module_subscriptions) {
                        const module = await this.moduleRepo.findOne({ where: { id: subDto.module_id } });
                        if (!module) continue;

                        const subscription = this.moduleSubscriptionRepo.create({
                            organization: saveOrganization,
                            module,
                            term: subDto.term,
                            price: subDto.price,
                            startDate: subDto.startDate || new Date().toISOString().split("T")[0],
                            endDate: subDto.endDate || new Date().toISOString().split("T")[0],
                        });
                        moduleSubs.push(subscription);
                    }
                    await this.moduleSubscriptionRepo.save(moduleSubs);
                }
                if (organizationDto?.themeConfig) {
                    const themeEntities = await this.themeRepo.create({
                        primary_color: organizationDto.themeConfig.primary_color,
                        secondary_color: organizationDto.themeConfig.secondary_color,
                        font_family: organizationDto.themeConfig.font_family
                    });
                    await this.themeRepo.save(themeEntities);
                    saveOrganization.themeConfig = themeEntities;
                    await this.organizationRepo.save(saveOrganization);
                }
                await this.pmsConfigRepo.save(pmsConfigList)

                // Fire-and-forget: notify Bookings Studio to auto-provision a site for this org
                this.triggerBookingsStudioAutoProvision(
                    saveOrganization.id,
                    saveOrganization.uuid,
                    saveOrganization.organization_name,
                    saveOrganization.organization_email
                );

                return { status: true, message: "Organization created successfully" };
            }
        }
        catch (err) {
            console.log("error occured!", err);
            return { status: false, message: err instanceof Error ? err.message : err };
        }
    }

    async sendInviteEmail(to: string, token: string) {
        console.log("into the send invite email!", to, token);
        const transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE || 'gmail',
            auth: {
                user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const inviteLink = `${process.env.INVITE_USER_LINK}?token=${token}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
            to,
            subject: 'You are invited!',
            html: `<p>Click the link below to set your password and activate your account:</p>
           <a href="${inviteLink}">${inviteLink}</a>`,
        };
        console.log("email sent!");

        await transporter.sendMail(mailOptions);
    }

    /**
     * Fire-and-forget POST to Bookings Studio auto-provision endpoint.
     * Creates a Site + default settings for the newly created organization.
     * Failures are logged but never block org creation.
     */
    private triggerBookingsStudioAutoProvision(
        organizationId: number,
        organizationUuid: string,
        name: string,
        email: string
    ): void {
        const apiUrl = process.env.BOOKINGS_STUDIO_API_URL;
        const internalToken = process.env.BOOKINGS_STUDIO_INTERNAL_TOKEN;

        if (!apiUrl || !internalToken) {
            console.warn(
                '[OrganizationService] Skipping Bookings Studio auto-provision: BOOKINGS_STUDIO_API_URL or BOOKINGS_STUDIO_INTERNAL_TOKEN not configured'
            );
            return;
        }

        // Derive domain from the organization email (part after @), fallback to empty string
        const domain = email?.includes('@') ? email.split('@')[1] : '';

        axios
            .post(
                `${apiUrl}/api/setup/auto-provision`,
                { organizationId, organizationUuid, name, domain },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-service-token': internalToken,
                    },
                    timeout: 10000, // 10s timeout to avoid hanging connections
                }
            )
            .then((res) => {
                console.log(
                    `[OrganizationService] Bookings Studio auto-provision succeeded for org ${organizationId}:`,
                    res.data
                );
            })
            .catch((err) => {
                const status = err?.response?.status;
                const data = err?.response?.data;
                console.error(
                    `[OrganizationService] Bookings Studio auto-provision failed for org ${organizationId}:`,
                    `Status: ${status || 'N/A'}`,
                    `Response: ${JSON.stringify(data || {})}`,
                    `Error: ${err.message || err}`
                );
                // Retry once after 3 seconds (bookings-studio-api might still be booting)
                if (!err._retried) {
                    setTimeout(() => {
                        console.log(`[OrganizationService] Retrying auto-provision for org ${organizationId}...`);
                        const retryErr = new Error('retry') as any;
                        retryErr._retried = true;
                        axios
                            .post(
                                `${apiUrl}/api/setup/auto-provision`,
                                { organizationId, organizationUuid, name, domain },
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-internal-service-token': internalToken,
                                    },
                                    timeout: 15000,
                                }
                            )
                            .then((res) => console.log(`[OrganizationService] Auto-provision retry succeeded for org ${organizationId}:`, res.data))
                            .catch((retryErr) => console.error(`[OrganizationService] Auto-provision retry also failed for org ${organizationId}:`, retryErr.message));
                    }, 3000);
                }
            });
    }

    async isEmailUnique(email: string): Promise<boolean> {
        const existingOrg = await this.organizationRepo.findOne({ where: { organization_email: email } });
        return !existingOrg; // true if not found (unique)
    }


    async getAllOrganization(currentUser?: any): Promise<OrganizationPmsListDto> {
        const isMaster = !currentUser || currentUser.role === 'platformOwner';

        const orgWhere = isMaster ? {} : { id: currentUser.organization_id };

        const organizationList = await this.organizationRepo.find({
            where: orgWhere,
            order: { id: "DESC" },
            relations: ["modules", "themeConfig", "pmsConfigs", "moduleSubscriptions"],
        });
        const usersList = await this.userRepo.find({ order: { id: 'DESC' } });
        // const themeList = await this.themeRepo.find({});
        const allOrganization = new OrganizationPmsListDto();

        const organizationDtoList: OrganizationPmsDto[] = []
        // console.log("modulesList", modulesList);
        for (const eachOrganization of organizationList) {
            const pmsList = await this.pmsMasterRepo.find({
                where: { organization_id: eachOrganization.id },
                select: ['id', 'pms_name', 'pms_location', 'pms_account', 'pms_url', 'is_archived']
            });
            const user = usersList.find(user => user.organization_id === eachOrganization.id && user.role === 'super_admin');

            const pmsConfigs = await this.pmsConfigRepo.find({
                where: { organization_id: eachOrganization.id },
                select: ['pms_id', 'credentials', 'apiKey']
            })

            const organizationRes = new OrganizationPmsDto();
            organizationRes.organization_id = eachOrganization.id;
            organizationRes.organization_name = eachOrganization.organization_name;
            organizationRes.organization_email = eachOrganization.organization_email;
            organizationRes.organization_location = eachOrganization.organization_location;
            organizationRes.organization_timezone = eachOrganization.organization_timezone || "";
            organizationRes.organization_contact_info = eachOrganization.organization_contact_info || "";
            organizationRes.organization_logo = eachOrganization.organization_logo || "";
            organizationRes.super_admin_name = user ? user?.firstName : '';
            organizationRes.super_admin_email = user ? user?.email : '';
            organizationRes.super_admin_phone = user ? user?.phone : '';
            organizationRes.super_admin_role = user ? user.role : '';
            organizationRes.no_of_pms = pmsList.length;
            organizationRes.organization_property_locations = eachOrganization.organization_property_locations || [];
            const pmsDtoList: PmsListDto[] = []

            for (const eachPms of pmsList) {
                const pmsConfig = pmsConfigs.find(pms => pms.pms_id === eachPms.id);

            const pmsMasterDto = new PmsListDto();
            pmsMasterDto.pms_id = eachPms.id;
            pmsMasterDto.pms_name = eachPms.pms_name
            pmsMasterDto.client_id = pmsConfig ? ((pmsConfig.credentials && pmsConfig.credentials !== null) && pmsConfig.credentials.client_id) : ""
            
            // FIX: For Dharma PMS, use apiKey as pms_client_secret
            if (eachPms.pms_name === 'dharma') {
                pmsMasterDto.pms_client_secret = pmsConfig?.apiKey || ""; // Use apiKey for Dharma
            } else {
                pmsMasterDto.pms_client_secret = pmsConfig ? (pmsConfig.credentials && pmsConfig.credentials !== null && pmsConfig.credentials.client_secret) : ""
            }

            if (eachPms.pms_name === 'mews') {
                pmsMasterDto.pms_client_name = pmsConfig ? (pmsConfig.credentials && pmsConfig.credentials !== null && pmsConfig.credentials.client_name) : "" // Use client_name for Mews
            }
            
            pmsMasterDto.pms_location = eachPms.pms_location
            pmsMasterDto.pms_account = eachPms.pms_account
            pmsMasterDto.pms_url = eachPms.pms_url
            pmsMasterDto.is_archived = eachPms.is_archived
            pmsDtoList.push(pmsMasterDto)
        }
        organizationRes.pms_list = pmsDtoList;
        organizationRes.modules = eachOrganization.modules;
        organizationRes.moduleSubscriptions = eachOrganization.moduleSubscriptions.map((sub) => ({
            module_id: sub.module.id,
            term: sub.term,
            price: sub.price,
            startDate: sub.startDate,
            endDate: sub.endDate,
        }));
        organizationRes.themeConfig = eachOrganization.themeConfig;
        organizationRes.is_archived = eachOrganization.is_archived;
        organizationRes.is_franchisor = eachOrganization.is_franchisor ?? false;
        organizationRes.parent_org_id = eachOrganization.parent_org_id ?? null;
        organizationDtoList.push(organizationRes);
    }

        allOrganization.organization_list = organizationDtoList;
        allOrganization.message = "fetch successfully"
        return allOrganization;
    }

    async getOrganizationById(organizationId: number): Promise<OrganizationPmsDto> {
        const eachOrganization = await this.organizationRepo.findOne({
            where: { id: organizationId, is_archived: false },
            relations: ["modules", "themeConfig", "pmsConfigs", "moduleSubscriptions"],
        });

        if (!eachOrganization) {
            throw new Error(`Organization with id ${organizationId} not found`);
        }

        const usersList = await this.userRepo.find({ order: { id: 'DESC' } });

        const pmsList = await this.pmsMasterRepo.find({
            where: { organization_id: eachOrganization.id },
            select: ['id', 'pms_name', 'pms_location', 'pms_account', 'pms_url', 'is_archived']
        });

        const user = usersList.find(user => user.organization_id === eachOrganization.id);

        const pmsConfigs = await this.pmsConfigRepo.find({
            where: { organization_id: eachOrganization.id },
            select: ['pms_id', 'credentials', 'apiKey']
        });

        const organizationRes = new OrganizationPmsDto();
        organizationRes.organization_id = eachOrganization.id;
        organizationRes.organization_name = eachOrganization.organization_name;
        organizationRes.organization_email = eachOrganization.organization_email;
        organizationRes.organization_location = eachOrganization.organization_location;
        organizationRes.organization_timezone = eachOrganization.organization_timezone || "";
        organizationRes.organization_contact_info = eachOrganization.organization_contact_info || "";
        organizationRes.organization_logo = eachOrganization.organization_logo || "";
        organizationRes.organization_property_locations = eachOrganization.organization_property_locations || [];
        organizationRes.super_admin_id = user ? user.id : '';
        organizationRes.super_admin_name = user ? user.firstName : '';
        organizationRes.super_admin_email = user ? user.email : '';
        organizationRes.super_admin_phone = user ? user.phone : '';
        organizationRes.super_admin_role = user?.role || '';
        organizationRes.no_of_pms = pmsList.length;

        const pmsDtoList: PmsListDto[] = [];
        for (const eachPms of pmsList) {
            const pmsConfig = pmsConfigs.find(pms => pms.pms_id === eachPms.id);
            const pmsMasterDto = new PmsListDto();
            pmsMasterDto.pms_id = eachPms.id;
            pmsMasterDto.pms_name = eachPms.pms_name;
            pmsMasterDto.client_id = pmsConfig?.credentials?.client_id || "";

            // FIX: For Dharma PMS, use apiKey as pms_client_secret
            if (eachPms.pms_name === 'dharma') {
                pmsMasterDto.pms_client_secret = pmsConfig?.apiKey || ""; // Use apiKey for Dharma
            } else {
                pmsMasterDto.pms_client_secret = pmsConfig?.credentials?.client_secret || "";
            }

            pmsMasterDto.pms_location = eachPms.pms_location;
            pmsMasterDto.pms_account = eachPms.pms_account;
            pmsMasterDto.pms_url = eachPms.pms_url;
            pmsMasterDto.is_archived = eachPms.is_archived;
            pmsDtoList.push(pmsMasterDto);
        }
        organizationRes.pms_list = pmsDtoList;
        organizationRes.modules = eachOrganization.modules;
        organizationRes.moduleSubscriptions = eachOrganization.moduleSubscriptions.map((sub) => ({
            module_id: sub.module.id,
            term: sub.term,
            price: sub.price,
            startDate: sub.startDate,
            endDate: sub.endDate,
        }));
        organizationRes.themeConfig = eachOrganization.themeConfig;
        organizationRes.is_archived = eachOrganization.is_archived;
        organizationRes.is_franchisor = eachOrganization.is_franchisor ?? false;
        organizationRes.parent_org_id = eachOrganization.parent_org_id ?? null;
        return organizationRes;
    }


    async getPropertiesByOrganizationId(id: number): Promise<PmsDto> {
        const organization = await this.organizationRepo.findOne({
            where: { id },
            relations: ['pmsConfigs'], // optional if you want PMS configs too
        });

        if (!organization) {
            throw new Error(`Organization with id ${id} not found`);
        }

        // find PMS linked to this organization
        const pms = await this.pmsMasterRepo.findOne({
            where: { organization_id: id },
        });

        return {
            organization_id: organization.id,
            organization_name: organization.organization_name,
            pms_name: pms?.pms_name ?? '',
            organization_property_locations: organization.organization_property_locations ?? [],
        };
    }

    async getModulesByOrganizationId(Id: number): Promise<ModuleListDto> {
        const organization = await this.organizationRepo.findOne({ where: { id: Id } });

        if (organization) {
            const moduleAccessList = await this.roleModuleAccessRepo
                .createQueryBuilder("role_module_access")
                .leftJoinAndSelect("role_module_access.module", "module")
                .leftJoinAndSelect("role_module_access.action", "action")
                .leftJoinAndSelect("role_module_access.sub_action", "sub_action")
                .distinctOn(["module_id", "action_id", "sub_action_id"])
                .where("organization_id = :Id", { Id })
                .andWhere("is_access =:status", { status: true })
                .getMany();

            const moduleResList = await this.roleModuleAccessService.prepareModuleData(moduleAccessList);

            // Append internal modules not already present via role_module_access (fallback for legacy orgs)
            const internalModules = await this.roleModuleAccessService.buildInternalModulesDtos();
            const existingModuleIds = new Set(moduleResList.map(m => m.module_id));
            const internalToAppend = internalModules.filter(m => !existingModuleIds.has(m.module_id));

            const moduleListDto = new ModuleListDto();
            moduleListDto.module_list = [...moduleResList, ...internalToAppend];
            return moduleListDto;
        }
    }


    async updateOrganizationById(
        organizationId: number,
        dto: OrganizationDto
    ): Promise<Organization> {

        const organization = await this.organizationRepo.findOne({
            where: { id: organizationId, is_archived: false },
            relations: ["modules", "themeConfig", "pmsConfigs"],
        });

        if (!organization) throw new Error("Organization not found");

        //  Update basic organization details
        organization.organization_name = dto.organization_name ?? organization.organization_name;
        organization.organization_email = dto.organization_email ?? organization.organization_email;
        organization.organization_location = dto.organization_location ?? organization.organization_location;
        organization.organization_timezone = dto.organization_timezone ?? organization.organization_timezone;
        organization.organization_contact_info = dto.organization_contact_info ?? organization.organization_contact_info;
        organization.organization_property_locations = dto.organization_property_locations ?? organization.organization_property_locations;
        if (dto.organization_logo !== undefined) {
            organization.organization_logo = dto.organization_logo;
        }
        if (dto.is_franchisor !== undefined) {
            organization.is_franchisor = dto.is_franchisor;
        }
        if (dto.parent_org_id !== undefined) {
            organization.parent_org_id = dto.parent_org_id;
        }


        await this.organizationRepo.save(organization);

        //  Update  super admin
        if (dto.super_admin) {
            let superAdmin = await this.userRepo.findOne({
                where: { organization_id: organizationId, email: dto.super_admin.email },
            });

            if (!superAdmin) {
                // If super admin doesn't exist, throw an error instead of creating
                throw new Error("Super admin not found for this organization");
            }

            // Update super admin fields
            if (dto.super_admin.new_email && dto.super_admin.new_email !== superAdmin.email) {
                const emailExists = await this.userRepo.findOne({ where: { email: dto.super_admin.new_email } });
                if (emailExists) throw new Error("User with this email already exists");
                superAdmin.email = dto.super_admin.new_email;
                superAdmin.emailVerificationToken = crypto.randomBytes(32).toString('hex');
                await this.sendInviteEmail(superAdmin.email, superAdmin.emailVerificationToken);
            }

            superAdmin.firstName = dto.super_admin.first_name ?? superAdmin.firstName;
            superAdmin.lastName = dto.super_admin.last_name ?? superAdmin.lastName;
            superAdmin.phone = dto.super_admin.phone ?? superAdmin.phone;
            superAdmin.role = dto.super_admin.user_role ?? superAdmin.role;

            await this.userRepo.save(superAdmin);
        }
        //  Update modules
        // Update modules and sync with role module access
        if (dto.module_ids?.length >= 0) {
            const previousModuleIds = organization.modules?.map(module => module.id) || [];
            const newModuleIds = dto.module_ids || [];

            // Update organization modules
            if (dto.module_ids.length > 0) {
                const modulesToAdd = await this.moduleRepo.findBy({ id: In(dto.module_ids) });
                organization.modules = modulesToAdd;
                await this.organizationRepo.save(organization);
            } else {
                // If no modules provided, clear all modules
                organization.modules = [];
                await this.organizationRepo.save(organization);
            }

            // Sync role module access for all roles in the organization
            await this.syncRoleModuleAccess(organizationId, previousModuleIds, newModuleIds);

            // Ensure internal modules are always present for every role in the org
            const orgRoles = await this.roleRepo.find({ where: { organization_id: organizationId } });
            for (const orgRole of orgRoles) {
                await this.assignInternalModulesToOrg(organizationId, orgRole.id);
            }
        }

        if (dto?.module_subscriptions?.length >= 0) {
            // 1. Fetch all existing subscriptions for the organization
            const existingSubs = await this.moduleSubscriptionRepo.find({
                where: { organization: { id: organizationId } },
                relations: ["module"],
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
                    existingSub.startDate = subDto.startDate || new Date().toISOString().split("T")[0];
                    existingSub.endDate = subDto.endDate || new Date().toISOString().split("T")[0];
                    moduleSubsToSave.push(existingSub);
                } else {
                    const subscription = this.moduleSubscriptionRepo.create({
                        organization,
                        module,
                        term: subDto.term,
                        price: subDto.price,
                        startDate: subDto.startDate || new Date().toISOString().split("T")[0],
                        endDate: subDto.endDate || new Date().toISOString().split("T")[0],
                    });
                    moduleSubsToSave.push(subscription);
                }
            }

            // 3. Delete subscriptions that are no longer in dto.module_subscriptions
            const subsToDelete = existingSubs.filter(sub => !incomingModuleIds.includes(sub.module.id));
            if (subsToDelete.length > 0) {
                await this.moduleSubscriptionRepo.remove(subsToDelete);
            }

            if (moduleSubsToSave.length > 0) {
                await this.moduleSubscriptionRepo.save(moduleSubsToSave);
            }
        }
        // Update PMS Masters and Configs
        if (dto.pms_master?.length > 0) {
            const existingPmsList = await this.pmsMasterRepo.find({ where: { organization_id: organizationId } });
            const incomingIds = dto.pms_master.map(p => p.pms_id).filter(Boolean);

            // Archive missing PMS
            for (const pms of existingPmsList) {
                if (!incomingIds.includes(pms.id)) {
                    pms.is_archived = true;
                    await this.pmsMasterRepo.save(pms);
                }
            }

            for (const pmsMaster of dto.pms_master) {
                let pms = null;

                if (pmsMaster.pms_id) {
                    // Look only for PMS that belongs to this organization
                    pms = await this.pmsMasterRepo.findOne({
                        where: { id: pmsMaster.pms_id, organization_id: organizationId }
                    });
                }

                if (pms) {
                    // Update existing PMS for this org
                    pms.pms_name = pmsMaster.pms_name || pms.pms_name;
                    pms.pms_account = pmsMaster.pms_account || pms.pms_account;
                    pms.pms_location = pmsMaster.pms_location || pms.pms_location;
                    pms.pms_url = pmsMaster.pms_url || pms.pms_url;
                    pms.is_archived = pmsMaster.is_archived ?? pms.is_archived;
                } else {
                    // Create new PMS for this org
                    pms = this.pmsMasterRepo.create({
                        organization_id: organizationId,
                        pms_name: pmsMaster.pms_name,
                        pms_account: pmsMaster.pms_account,
                        pms_location: pmsMaster.pms_location,
                        pms_url: pmsMaster.pms_url,
                        is_archived: false,
                    });
                }

                const savedPms = await this.pmsMasterRepo.save(pms);
                // --- PMS Config ---
                const staticConfig = PMS_CONFIGS[pmsMaster.pms_name?.toLowerCase()];
                if (staticConfig) {
                    let configEntity = await this.pmsConfigRepo.findOne({
                        where: { organization_id: organizationId, pms_id: savedPms.id },
                    });

                    if (!configEntity) {

                        configEntity = this.pmsConfigRepo.create({
                            organization_id: organizationId,
                            pms_id: savedPms.id,
                            baseUrl: staticConfig.baseUrl,
                            authType: pmsMaster.pms_name === "dharma" ? AuthType.APIKEY : staticConfig?.authType,
                            authUrl: staticConfig.authUrl,
                            apiKey: pmsMaster.pms_name === "dharma" ? "73de46d3-12ec-4447-aca6-6158ddf3f4fb" : null,
                            credentials: pmsMaster.pms_name === "dharma" ? null : {
                                client_id: pmsMaster.client_id,
                                client_secret: pmsMaster.pms_client_secret,
                                client_name:pmsMaster?.client_name == "" ? null : pmsMaster?.client_name
                            },

                            endpoints: staticConfig.endpoints,
                            fields: staticConfig.fields,
                        });
                    } else {
                        // Update existing config
                        configEntity.baseUrl = staticConfig.baseUrl;
                        configEntity.authType = pmsMaster.pms_name === "dharma" ? AuthType.APIKEY : staticConfig?.authType;
                        configEntity.authUrl = staticConfig.authUrl;
                        configEntity.apiKey = pmsMaster.pms_name === "dharma" ? "73de46d3-12ec-4447-aca6-6158ddf3f4fb" : null;
                        configEntity.credentials = pmsMaster.pms_name === "dharma" ? null : {
                            client_id: pmsMaster.client_id,
                            client_secret: pmsMaster.pms_client_secret,
                            apikey: null,
                            client_name:pmsMaster?.client_name == "" ? null : pmsMaster?.client_name
                        };
                        configEntity.endpoints = staticConfig.endpoints;
                        configEntity.fields = staticConfig.fields;
                    }

                    await this.pmsConfigRepo.save(configEntity);
                }
            }
        }

        // Update theme config
        if (dto.themeConfig) {
            if (organization.themeConfig) {
                const theme = organization.themeConfig;
                theme.primary_color = dto.themeConfig.primary_color ?? theme.primary_color;
                theme.secondary_color = dto.themeConfig.secondary_color ?? theme.secondary_color;
                theme.font_family = dto.themeConfig.font_family ?? theme.font_family;
                await this.themeRepo.save(theme);
            } else {
                const newTheme = this.themeRepo.create({
                    ...dto.themeConfig,
                    organization: organization,
                });
                await this.themeRepo.save(newTheme);
                organization.themeConfig = newTheme;
                await this.organizationRepo.save(organization);
            }
        }

        // Return updated organization
        return this.organizationRepo.findOne({
            where: { id: organization.id },
            relations: ["modules", "themeConfig", "pmsConfigs"],
        }) as Promise<Organization>;
    }

    private async syncRoleModuleAccess(
        organizationId: number,
        previousModuleIds: number[],
        newModuleIds: number[]
    ): Promise<void> {
        // Find added and removed modules
        const addedModules = newModuleIds.filter(id => !previousModuleIds.includes(id));
        const removedModules = previousModuleIds.filter(id => !newModuleIds.includes(id));

        const roles = await this.roleRepo.find({
            where: { organization_id: organizationId }
        });

        for (const role of roles) {
            // COMPLETE AND EFFICIENT REMOVAL
            if (removedModules.length > 0) {
                // Remove ALL role module access records for the removed modules
                await this.roleModuleAccessRepo
                    .createQueryBuilder()
                    .delete()
                    .from(RoleModuleAccess)
                    .where("organization_id = :orgId", { orgId: organizationId })
                    .andWhere("role_id = :roleId", { roleId: role.id })
                    .andWhere("module_id IN (:...moduleIds)", { moduleIds: removedModules })
                    .execute();
            }

            // DUPLICATION-PROOF ADDITION
            if (addedModules.length > 0) {
                // Check for ANY existing access to these modules (even if partial)
                const existingAccesses = await this.roleModuleAccessRepo
                    .createQueryBuilder("rma")
                    .select("DISTINCT rma.module_id", "module_id")
                    .where("rma.organization_id = :orgId", { orgId: organizationId })
                    .andWhere("rma.role_id = :roleId", { roleId: role.id })
                    .andWhere("rma.module_id IN (:...moduleIds)", { moduleIds: addedModules })
                    .getRawMany();

                const existingModuleIds = existingAccesses.map(access => access.module_id);
                const modulesToAdd = addedModules.filter(moduleId => !existingModuleIds.includes(moduleId));

                await this.createComprehensiveRoleModuleAccess(organizationId, role.id, modulesToAdd);
            }
        }
    }

    private async createComprehensiveRoleModuleAccess(
        organizationId: number,
        roleId: number,
        moduleIds: number[]
    ): Promise<void> {
        if (moduleIds.length === 0) return;

        const roleAccessEntities: RoleModuleAccess[] = [];

        // Get all modules in one query
        const modules = await this.moduleRepo.find({
            where: { id: In(moduleIds) }
        });

        // Get all actions for these modules
        const actions = await this.actionRepo.find({
            where: { module_id: In(moduleIds) }
        });

        // Get all sub-actions for these actions
        const actionIds = actions.map(action => action.id);
        const subActions = actionIds.length > 0 ? await this.subActionRepo.find({
            where: { action_id: In(actionIds) }
        }) : [];

        // Group actions by module
        const actionsByModule = actions.reduce((acc, action) => {
            if (!acc[action.module_id]) acc[action.module_id] = [];
            acc[action.module_id].push(action);
            return acc;
        }, {});

        // Group sub-actions by action
        const subActionsByAction = subActions.reduce((acc, subAction) => {
            if (!acc[subAction.action_id]) acc[subAction.action_id] = [];
            acc[subAction.action_id].push(subAction);
            return acc;
        }, {});

        for (const module of modules) {
            // Module-level access
            roleAccessEntities.push(this.roleModuleAccessRepo.create({
                organization_id: organizationId,
                role_id: roleId,
                module_id: module.id,
                is_access: true,
            }));

            // Action-level access for this module
            const moduleActions = actionsByModule[module.id] || [];
            for (const action of moduleActions) {
                roleAccessEntities.push(this.roleModuleAccessRepo.create({
                    organization_id: organizationId,
                    role_id: roleId,
                    module_id: module.id,
                    action_id: action.id,
                    is_access: true,
                }));

                // Sub-action-level access for this action
                const actionSubActions = subActionsByAction[action.id] || [];
                for (const subAction of actionSubActions) {
                    roleAccessEntities.push(this.roleModuleAccessRepo.create({
                        organization_id: organizationId,
                        role_id: roleId,
                        module_id: module.id,
                        action_id: action.id,
                        sub_action_id: subAction.id,
                        is_access: true,
                    }));
                }
            }
        }

        // Save all in one batch operation
        if (roleAccessEntities.length > 0) {
            await this.roleModuleAccessRepo.save(roleAccessEntities);
        }
    }

    /**
     * Assigns all internal modules to the given org+role in role_module_access.
     * Idempotent — skips any module that already has access entries.
     * Does NOT touch organization_modules join table, so update sync never removes them.
     */
    private async assignInternalModulesToOrg(
        organizationId: number,
        roleId: number
    ): Promise<void> {
        const internalModules = await this.moduleRepo.find({
            where: { is_internal: true, status: true }
        });
        if (internalModules.length === 0) return;

        // Only create entries for modules not already present for this org+role
        const existingAccesses = await this.roleModuleAccessRepo
            .createQueryBuilder("rma")
            .select("DISTINCT rma.module_id", "module_id")
            .where("rma.organization_id = :orgId", { orgId: organizationId })
            .andWhere("rma.role_id = :roleId", { roleId })
            .andWhere("rma.module_id IN (:...moduleIds)", { moduleIds: internalModules.map(m => m.id) })
            .getRawMany();

        const existingModuleIds = existingAccesses.map(a => Number(a.module_id));
        const missingModuleIds = internalModules
            .map(m => m.id)
            .filter(id => !existingModuleIds.includes(id));

        if (missingModuleIds.length > 0) {
            await this.createComprehensiveRoleModuleAccess(organizationId, roleId, missingModuleIds);
            console.log(`[assignInternalModules] org=${organizationId} role=${roleId} added modules: [${missingModuleIds.join(', ')}]`);
        }
    }


    async updateOrganizationStatus(
        organizationId: number,
        status: "pending" | "onboarded"
    ): Promise<{ status: boolean; message: string }> {
        try {
            const organization = await this.organizationRepo.findOne({
                where: { id: organizationId, is_archived: false },
            });

            if (!organization) {
                throw new Error("Organization not found");
            }

            organization.organization_status = status;
            await this.organizationRepo.save(organization);

            return {
                status: true,
                message: `Organization status updated to ${status}`,
            };
        } catch (err) {
            console.error("Error updating organization status:", err);
            return {
                status: false,
                message:
                    err instanceof Error ? err.message : "Failed to update organization status",
            };
        }
    }

    async deleteOrganization(organizationId: number) {
        const organization = await this.organizationRepo.findOne({ where: { id: organizationId } });

        if (!organization) {
            throw new Error("Organization not found");
        }
        if (organization.is_archived) {
            return { message: "Organization already archived" };
        }
        organization.is_archived = true;
        return await this.organizationRepo.save(organization);
    }

    async restoreOrganization(organizationId: number) {
        const organization = await this.organizationRepo.findOne({ where: { id: organizationId } });

        if (!organization) {
            throw new Error("Organization not found");
        }
        if (!organization.is_archived) {
            return { message: "Organization already restored" };
        }
        organization.is_archived = false;
        return await this.organizationRepo.save(organization);
    }

    async getFranchiseesByFranchisorId(franchisorId: number, query: PaginateQuery): Promise<FranchiseListDto> {
        const page = Math.max(query.page ?? 1, 1);
        const limit = Math.min(query.limit ?? 10, 100);
        const search = query.search?.trim() ?? '';
        const skip = (page - 1) * limit;

        const qb = this.organizationRepo
            .createQueryBuilder('org')
            .where('org.parent_org_id = :franchisorId', { franchisorId })
            .andWhere('org.is_archived = false');

        if (search) {
            qb.andWhere(
                `(
                    LOWER(org.organization_name) LIKE LOWER(:search)
                    OR LOWER(org.organization_location) LIKE LOWER(:search)
                    OR LOWER(CONCAT('FRN-', LPAD(CAST(org.id AS TEXT), 3, '0'))) LIKE LOWER(:search)
                )`,
                { search: `%${search}%` },
            );
        }

        const [franchisees, total] = await qb
            .orderBy('org.id', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const usersList = franchisees.length > 0
            ? await this.userRepo.find({
                where: { organization_id: In(franchisees.map(f => f.id)) },
                select: ['id', 'firstName', 'lastName', 'email', 'role', 'organization_id'],
            })
            : [];

        const franchiseItemList: FranchiseItemDto[] = franchisees.map(org => {
            const usersInOrg = usersList.filter(u => u.organization_id === org.id);
            const superAdmin = usersInOrg.find(u => u.role === 'super_admin');

            const item = new FranchiseItemDto();
            item.id = org.id;
            item.franchise_id = `FRN-${String(org.id).padStart(3, '0')}`;
            item.organization_name = org.organization_name;
            item.organization_location = org.organization_location || '';
            item.organization_status = org.organization_status || 'pending';
            item.is_franchisor = org.is_franchisor ?? false;
            item.parent_org_id = org.parent_org_id ?? null;
            item.user_count = usersInOrg.length;
            item.super_admin_name = superAdmin
                ? `${superAdmin.firstName} ${superAdmin.lastName || ''}`.trim()
                : '';
            item.super_admin_email = superAdmin?.email || '';
            return item;
        });

        const result = new FranchiseListDto();
        result.franchise_list = franchiseItemList;
        result.total = total;
        result.page = page;
        result.limit = limit;
        result.message = 'Fetched successfully';
        return result;
    }

}
