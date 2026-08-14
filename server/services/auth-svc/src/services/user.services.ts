import { In, Repository } from "typeorm";
import { AppDataSource } from "../db";
import * as crypto from "crypto";
import { EmailService } from "./email.service";
import { RoleModuleAccessService } from "./rolemoduleaccess.service";
import { RoleModuleAccess } from "../entity/rolemoduleaccess.model";
import { ModuleResDto } from "../dto/moduleres.dto";
import { UserUpdateDto } from "../dto/userupdate.dto";
import { Roles } from "../entity/roles.model";
import { FilterOperator, paginate, Paginated } from "nestjs-paginate";
import {
  Organization,
  Unit,
  User,
  UserAddress,
  UserBankAccount,
} from "@shared/entities";
import { PaginateQuery } from "@shared/common";
import { NotificationBootstrapService } from "./notification-bootstrap.service";

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
  organizationId: number;
  roleId?: number;
  propertyIds?: number[];
}

export interface UserCreateResponse {
  user: User;
  module_list_access_by_user: ModuleResDto[];
}

export class UserService {
  private userRepository: Repository<User>;
  private emailService: EmailService;
  private roleModuleAccessService: RoleModuleAccessService;
  private roleModuleAccessRepo: Repository<RoleModuleAccess>;
  private roleRepo: Repository<Roles>;
  private organizationRepository: Repository<Organization>;
  private userAddressRepository: Repository<UserAddress>;
  private bankAccountRepository: Repository<UserBankAccount>;
  private unitRepository: Repository<Unit>;
  private notificationBootstrapService: NotificationBootstrapService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.emailService = new EmailService();
    this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
    this.roleModuleAccessService = new RoleModuleAccessService();
    this.roleRepo = AppDataSource.getRepository(Roles);
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.userAddressRepository = AppDataSource.getRepository(UserAddress);
    this.bankAccountRepository = AppDataSource.getRepository(UserBankAccount);
    this.unitRepository = AppDataSource.getRepository(Unit);
    this.notificationBootstrapService = new NotificationBootstrapService();
  }

  async createUser(
    registerDto: Partial<RegisterDto>,
  ): Promise<UserCreateResponse> {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      organizationId,
      roleId,
      propertyIds,
    } = registerDto;
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new Error("Organization not found");
    }
    if (organization.is_archived) {
      throw new Error("Cannot invite user to an archived organization");
    }
    if (
      organization.organization_status === "deleted" ||
      organization.organization_status === "inactive"
    ) {
      throw new Error(
        "Cannot invite user to a deleted or inactive organization",
      );
    }

    const userRole = await this.roleRepo.findOne({ where: { id: roleId } });

    // Create new user
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.password = password;
    user.role = userRole.name;
    user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const expiryMinutes = parseInt(
      process.env.INVITE_TOKEN_EXPIRY_MINUTES || "480",
      10,
    );
    user.emailVerificationExpires = new Date(
      Date.now() + expiryMinutes * 60 * 1000,
    );
    user.organization_id = organizationId;
    user.roleId = roleId;
    if (propertyIds && Array.isArray(propertyIds) && propertyIds.length > 0) {
      user.property_ids = propertyIds;
    }

    try {
      await this.userRepository.save(user);
      await this.notificationBootstrapService.bootstrapUserPreference({
        userId: user.id,
        organizationId,
        timezone: organization.organization_timezone || null,
      });
      await this.notificationBootstrapService.bootstrapRolePreference({
        organizationId,
        role: user.role,
        roleId: userRole?.id ?? null,
      });

      const userAccessList = await this.roleModuleAccessRepo.find({
        where: {
          organization_id: user.organization_id,
          role_id: roleId,
          is_access: true,
        },
        relations: ["module", "action", "sub_action"],
      });

      const moduleAcessList =
        await this.roleModuleAccessService.prepareModuleData(userAccessList);
      const userResDto: UserCreateResponse = {
        user: user,
        module_list_access_by_user: moduleAcessList,
      };
      await this.emailService.sendInviteEmail(
        email,
        user.emailVerificationToken,
      );
      return userResDto;
    } catch (error) {
      throw new Error(error);
    }
  }

  async verifyAndSetPassword(token: string, password: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires.getTime() < Date.now()
    ) {
      throw new Error(
        "Invitation link has expired. Please request a new invitation.",
      );
    }

    user.password = password;
    user.isActive = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await this.userRepository.save(user);
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await this.userRepository.save(user);

    // TODO: Send email with reset token
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new Error("Invalid reset token");
    }

    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      throw new Error("Reset token has expired");
    }

    user.password = newPassword; // Will be hashed by @BeforeUpdate
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // Invalidate all sessions

    await this.userRepository.save(user);
  }

  async getAllUsers(query: PaginateQuery, currentUser?: any): Promise<Paginated<User>> {

    const restrictedRoles = ['executor', 'inspector', 'owner'];
    const selectQuery = this.userRepository
      .createQueryBuilder("user")

    if (currentUser && restrictedRoles.includes(currentUser.role)) {
      selectQuery.andWhere("user.id = :id", { id: currentUser.id });
    }

    if (query.search?.trim()) {
      const search = query.search.trim();

      selectQuery.andWhere(
        `CONCAT(user.firstName, ' ', user.lastName) ILIKE :search`,
        {
          search: `%${search}%`,
        },
      );
    }

    const result = await paginate(query as any, selectQuery, {
      filterableColumns: {
        isActive: [FilterOperator.IN],
        organization_id: [FilterOperator.EQ],
      },
      relations: ["organization"],
      // searchableColumns: ["firstName", "lastName"],
      sortableColumns: ["firstName", "lastName", "createdAt"],
      defaultSortBy: [["createdAt", "DESC"]],
      defaultLimit: 10,
    });
    const userIds = result.data.map((user) => user.id);
    const userWithRelations = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: ["units", "units.property"]
    });
    const userMap = new Map(userWithRelations.map(u => [u.id, u]));

    result.data = result.data.map((user) => {
      const fullUser = userMap.get(user.id);
      if (!user.property_ids?.length) {
        const propertyIds = (fullUser.units || []).map((unit) => unit?.property?.id)

        user.property_ids = [...new Set(propertyIds)];
      }

      return user;
    });
    return result;
  }

  async editUserAccountDetail(updateDto: any): Promise<User> {
    const {
      email,
      firstName,
      password,
      lastName,
      phone,
      role,
      isActive,
      company_identification_number,
      tax_number,
      freefield1,
      freefield2,
      unitIds,
      location_coordinate,
      location_coordinate_end,
    } = updateDto;
    const existingUser = await this.userRepository.findOne({
      where: { email },
      relations: ["units"],
    });
    if (!existingUser) {
      throw new Error("User with this email does not exist");
    }
    if (firstName !== undefined) existingUser.firstName = firstName;
    if (lastName !== undefined) existingUser.lastName = lastName;
    if (phone !== undefined) existingUser.phone = phone;
    if (role !== undefined) existingUser.role = role;
    if (isActive !== undefined) existingUser.isActive = isActive;
    if (password !== undefined) existingUser.password = password;
    if (company_identification_number !== undefined) existingUser.company_identification_number = company_identification_number;
    if (tax_number !== undefined) existingUser.tax_number = tax_number;
    if (freefield1 !== undefined) existingUser.freefield1 = freefield1;
    if (freefield2 !== undefined) existingUser.freefield2 = freefield2;
    if (location_coordinate !== undefined) existingUser.location_coordinate = location_coordinate;
    if (location_coordinate_end !== undefined) existingUser.location_coordinate_end = location_coordinate_end;

    if (unitIds !== undefined && Array.isArray(unitIds)) {
      existingUser.units = unitIds.length > 0
        ? await this.unitRepository.find({ where: { id: In(unitIds) } })
        : [];
    }

    if (updateDto.propertyIds !== undefined && Array.isArray(updateDto.propertyIds)) {
      existingUser.property_ids = updateDto.propertyIds;
    }

    existingUser.address = [];
    if (updateDto.address && Array.isArray(updateDto.address)) {
      updateDto.address.map((addr: UserAddress) => {
        existingUser.address.push(
          this.userAddressRepository.create({
            ...addr,
            user: existingUser,
          }),
        );
      });
    }

    existingUser.bank_account = [];
    if (updateDto.bank_account && Array.isArray(updateDto.bank_account)) {
      updateDto.bank_account.map((bankAccount: UserBankAccount) => {
        existingUser.bank_account.push(
          this.bankAccountRepository.create({
            ...bankAccount,
            user: existingUser,
          }),
        );
      });
    }

    const updatedUser = await this.userRepository.save(existingUser);
    console.log("Updated user:", updatedUser);
    return updatedUser;
  }

  async getUserProfileByToken(userToken): Promise<User> {
    const { token } = userToken;
    const existingUser = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
    if (!existingUser) {
      throw new Error("Invalid token");
    }

    if (
      !existingUser.emailVerificationExpires ||
      existingUser.emailVerificationExpires.getTime() < Date.now()
    ) {
      throw new Error("Invitation link has expired");
    }

    return existingUser;
  }

  async reInviteUserById(
    userId: string,
  ): Promise<{ status: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return {
        status: false,
        message: "Invalid User",
      };
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: user.organization_id },
    });
    if (!organization) {
      return {
        status: false,
        message: "Organization not found",
      };
    }
    if (organization.is_archived) {
      return {
        status: false,
        message: "Cannot re-invite user to an archived organization",
      };
    }
    if (
      organization.organization_status === "deleted" ||
      organization.organization_status === "inactive"
    ) {
      return {
        status: false,
        message: "Cannot re-invite user to a deleted or inactive organization",
      };
    }

    user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const expiryMinutes = parseInt(
      process.env.INVITE_TOKEN_EXPIRY_MINUTES || "480",
      10,
    );
    user.emailVerificationExpires = new Date(
      Date.now() + expiryMinutes * 60 * 1000,
    );
    await this.userRepository.save(user);

    await this.emailService.sendInviteEmail(
      user.email,
      user.emailVerificationToken,
    );
    return {
      status: true,
      message: "Re-Invite Sent Successfully",
    };
  }

  async updateUserById(
    id: string,
    dto: UserUpdateDto,
    loginUser: User,
  ): Promise<{ status: boolean; message: string }> {
    if (
      dto.firstName ||
      dto.lastName ||
      dto.email ||
      dto.password ||
      dto.phone ||
      dto.dob !== undefined ||
      dto.role !== undefined ||
      dto.roleId !== undefined ||
      dto.isActive !== undefined ||
      dto.external_user !== undefined ||
      dto.owner_type !== undefined ||
      dto.is_task_view !== undefined ||
      dto.is_reservation_view !== undefined ||
      dto.is_unit_view !== undefined ||
      dto.is_document_view !== undefined ||
      dto.is_graph_view !== undefined ||
      dto.cost_per_hour !== undefined ||
      dto.cost_per_month !== undefined ||
      dto.include_trip_cost !== undefined ||
      dto.cost_per_km !== undefined ||
      dto.company_identification_number !== undefined ||
      dto.tax_number !== undefined ||
      dto.freefield1 !== undefined ||
      dto.freefield2 !== undefined ||
      dto.owner_details !== undefined ||
      dto.docs !== undefined ||
      dto.task_types !== undefined ||
      dto.reservation_details !== undefined ||
      dto.unit_types !== undefined ||
      dto.location_coordinate !== undefined ||
      dto.location_coordinate_end !== undefined
    ) {
      const regularUser = await this.userRepository.findOne({ where: { id } });
      if (!regularUser) {
        throw new Error(`User with id ${id} not found`);
      }
      this.userRepository.merge(regularUser, dto);
      await this.userRepository.save(regularUser);
    }
    const role = await this.roleRepo.findOne({
      where: { id: loginUser.roleId },
    });

    if (role.name === "platformOwner" && dto.module_list) {
      const assignModulesList: RoleModuleAccess[] = [];
      for (const module of dto.module_list) {
        const existingModuleAccess = await this.roleModuleAccessRepo.findOne({
          where: {
            organization_id: module.organization_id,
            module_id: module.module_id,
            role_id: module.role_id,
            action_id: module.action_id,
            sub_action_id: module.sub_action_id,
          },
        });
        if (existingModuleAccess) {
          if (existingModuleAccess.is_access !== module.is_access) {
            await this.roleModuleAccessRepo.update(
              { id: existingModuleAccess.id },
              { is_access: module.is_access },
            );
          }
        } else {
          const newModuleAccess: RoleModuleAccess =
            this.roleModuleAccessRepo.create({
              role_id: module.role_id,
              organization_id: module.organization_id,
              module_id: module.module_id,
              action_id: module.action_id,
              sub_action_id: module.sub_action_id,
              is_access: module.is_access,
            });
          assignModulesList.push(newModuleAccess);
        }
      }
      await this.roleModuleAccessRepo.save(assignModulesList);

      return { status: true, message: "All Records Updated Successfully" };
    }

    if (dto.unitIds !== undefined && Array.isArray(dto.unitIds)) {
      const userWithUnits = await this.userRepository.findOne({
        where: { id },
        relations: ["units"],
      });
      if (!userWithUnits) {
        throw new Error(`User with id ${id} not found`);
      }
      userWithUnits.units = dto.unitIds.length > 0
        ? await this.unitRepository.find({ where: { id: In(dto.unitIds) } })
        : [];
      await this.userRepository.save(userWithUnits);
    }

    if (dto.propertyIds !== undefined && Array.isArray(dto.propertyIds)) {
      const userForProperties = await this.userRepository.findOne({ where: { id } });
      if (!userForProperties) {
        throw new Error(`User with id ${id} not found`);
      }
      userForProperties.property_ids = dto.propertyIds;
      await this.userRepository.save(userForProperties);
    }

    return { status: true, message: "User updated successfully" };
  }

  async getUserById(userId: string): Promise<UserCreateResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["bank_account", "address", "address.country", "units", "units.property"],
    });
    if (user != null) {
      const userRes = new User();
      userRes.id = user.id;
      userRes.organization_id = user.organization_id;
      userRes.roleId = user.roleId;
      userRes.firstName = user.firstName;
      userRes.lastName = user.lastName;
      userRes.email = user.email;
      userRes.phone = user.phone;
      userRes.isActive = user.isActive;
      userRes.role = user.role;
      userRes.dob = user.dob;
      userRes.bank_account = user.bank_account;
      userRes.address = user.address;
      userRes.external_user = user.external_user;
      userRes.owner_type = user.owner_type;
      userRes.is_task_view = user.is_task_view;
      userRes.is_reservation_view = user.is_reservation_view;
      userRes.is_unit_view = user.is_unit_view;
      userRes.is_document_view = user.is_document_view;
      userRes.is_graph_view = user.is_graph_view;
      userRes.task_types = user.task_types;
      userRes.reservation_details = user.reservation_details;
      userRes.unit_types = user.unit_types;
      userRes.cost_per_hour = user.cost_per_hour;
      userRes.cost_per_month = user.cost_per_month;
      userRes.include_trip_cost = user.include_trip_cost;
      userRes.cost_per_km = user.cost_per_km;
      userRes.company_identification_number = user.company_identification_number;
      userRes.tax_number = user.tax_number;
      userRes.freefield1 = user.freefield1;
      userRes.freefield2 = user.freefield2;
      userRes.units = user.units;
      userRes.docs = user.docs;

      if (!user.property_ids?.length) {
        const propertyIds = (user.units || []).map((unit) => unit?.property?.id)

        user.property_ids = [...new Set(propertyIds)];
      }
      userRes.property_ids = user.property_ids;
      const userAccessList = await this.roleModuleAccessRepo.find({
        where: {
          organization_id: user.organization_id,
          role_id: user.roleId,
          is_access: true,
        },
        relations: ["module", "action", "sub_action"],
      });

      const moduleAcessList =
        await this.roleModuleAccessService.prepareModuleData(userAccessList);

      const userResDto: UserCreateResponse = {
        user: userRes,
        module_list_access_by_user: moduleAcessList,
      };

      return userResDto;
    }
  }

  async getUsersByOrganizationId(organizationId: number) {
    const users = await this.userRepository.find({
      where: { organization_id: organizationId },
    });
    return users;
  }

  async saveFcmToken(
    userId: string,
    token: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.fcm_token = token;
      await this.userRepository.save(user);
      return {
        success: true,
        message: 'FCM token saved successfully',
      };
    } else {
      return {
        success: false,
        message: 'User not found',
      };
    }
  }
}
