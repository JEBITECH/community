import { Repository } from "typeorm";
import { AppDataSource } from "../db";
import { Roles } from "../entity/roles.model";
import { RolesDto } from "../dto/roles.dto";
import { RolesListDto } from "../dto/rolelist.dto";
import { RoleResDto } from "../dto/roleresdto";
import { Organization } from "@shared/entities";
import { NotificationBootstrapService } from "./notification-bootstrap.service";

export class RoleService {
    private roleRepo: Repository<Roles>;
    private OrganizationRepo: Repository<Organization>;
    private notificationBootstrapService: NotificationBootstrapService;


    constructor() {
        this.roleRepo = AppDataSource.getRepository(Roles);
        this.OrganizationRepo = AppDataSource.getRepository(Organization);
        this.notificationBootstrapService = new NotificationBootstrapService();

    }
    async create(roleDto: RolesDto): Promise<Roles> {
        try {
            const organization = await this.OrganizationRepo.findOne({ where: { id: roleDto.organization_id } });
            if (organization) {
                const role = this.roleRepo.create({
                    name: roleDto.name,
                    status: roleDto.status,
                    organization_id: roleDto.organization_id
                });
                const savedRole = await this.roleRepo.save(role);
                await this.notificationBootstrapService.bootstrapRolePreference({
                    organizationId: roleDto.organization_id,
                    role: savedRole.name,
                    roleId: savedRole.id,
                });
                return savedRole;
            }
        } catch (error) {
            console.error('Error creating role:', error);
            throw new Error('Failed to create role');
        }
    }

    async getAllRoles(): Promise<RolesListDto> {
        const roleList = await this.roleRepo.find({ order: { id: 'DESC' } });
        console.log('role list ', roleList);

        const roleListDto: RoleResDto[] = []
        for (const role of roleList) {

            const roleDto = new RoleResDto();
            roleDto.role_id = role.id;
            roleDto.name = role.name;
            roleDto.organization_id = role.organization_id;
            roleDto.status = role.status;
            roleListDto.push(roleDto);

        }
        const allRoles = new RolesListDto();
        allRoles.role_list = roleListDto;
        return allRoles;
    }

    async getRoleByOrganizationId(organizationId: number): Promise<RolesListDto> {
        const roleList = await this.roleRepo.find({ where: { organization_id: organizationId } });

        const roleListDto: RoleResDto[] = []
        for (const role of roleList) {

            const roleDto = new RoleResDto();
            roleDto.role_id = role.id;
            roleDto.name = role.name;
            roleDto.organization_id = role.organization_id;
            roleDto.status = role.status;
            roleListDto.push(roleDto);

        }
        const allRoles = new RolesListDto();
        allRoles.role_list = roleListDto;
        return allRoles;
    }

    async updateRoleById(id: number, dto: RolesDto): Promise<Roles> {

        const role = await this.roleRepo.findOne({ where: { id } });
        if (!role) {
            throw new Error(`role with id ${id} not found`);
        }
        this.roleRepo.merge(role, dto);


        return await this.roleRepo.save(role);
    }

}
