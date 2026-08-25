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
  User,
  UserAddress,
  UserBankAccount,
  Membership,
} from "@shared/entities";
import { PaginateQuery } from "@shared/common";
import { Role } from "@shared/common";
import { NotificationBootstrapService } from "./notification-bootstrap.service";

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  organizationId: number;
  roleId: number;
  memberType?: "internal" | "external";
  unitIdentifier?: string;
}

export interface UserCreateResponse {
  user: User;
  membership?: Membership | null;
  module_list_access_by_user: ModuleResDto[];
}

export class UserService {
  private userRepository: Repository<User>;
  private membershipRepository: Repository<Membership>;
  private emailService: EmailService;
  private roleModuleAccessService: RoleModuleAccessService;
  private roleModuleAccessRepo: Repository<RoleModuleAccess>;
  private roleRepo: Repository<Roles>;
  private organizationRepository: Repository<Organization>;
  private userAddressRepository: Repository<UserAddress>;
  private bankAccountRepository: Repository<UserBankAccount>;
  private notificationBootstrapService: NotificationBootstrapService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.membershipRepository = AppDataSource.getRepository(Membership);
    this.emailService = new EmailService();
    this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
    this.roleModuleAccessService = new RoleModuleAccessService();
    this.roleRepo = AppDataSource.getRepository(Roles);
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.userAddressRepository = AppDataSource.getRepository(UserAddress);
    this.bankAccountRepository = AppDataSource.getRepository(UserBankAccount);
    this.notificationBootstrapService = new NotificationBootstrapService();
  }

  /** Admin-invites a member into an organization (creates the User if new, always creates a fresh Membership). */
  async createUser(registerDto: Partial<RegisterDto>): Promise<UserCreateResponse> {
    const { email, password, firstName, lastName, phone, organizationId, roleId, memberType, unitIdentifier } = registerDto;

    const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new Error("Organization not found");
    }
    if (organization.is_archived) {
      throw new Error("Cannot invite user to an archived organization");
    }
    if (organization.organization_status === "suspended") {
      throw new Error("Cannot invite user to a suspended organization");
    }

    const userRole = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!userRole) {
      throw new Error("Role not found");
    }

    let user = await this.userRepository.findOne({ where: { email } });
    const isNewUser = !user;

    if (user) {
      const existingMembership = await this.membershipRepository.findOne({
        where: { user_id: user.id!, organization_id: organizationId },
      });
      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }
    } else {
      user = new User();
      user.firstName = firstName!;
      user.lastName = lastName;
      user.email = email;
      user.phone = phone;
      user.password = password;
      user.role = userRole.name;
      user.roleId = roleId;
      user.isActive = false;
      user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const expiryMinutes = parseInt(process.env.INVITE_TOKEN_EXPIRY_MINUTES || "480", 10);
      user.emailVerificationExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
      await this.userRepository.save(user);
    }

    const isFirstMembership = (await this.membershipRepository.count({ where: { user_id: user.id! } })) === 0;
    const membership = this.membershipRepository.create({
      user_id: user.id!,
      organization_id: organizationId,
      role: userRole.name,
      roleId,
      member_type: memberType || "internal",
      unit_identifier: unitIdentifier,
      status: "active",
      joined_at: new Date(),
      is_default: isFirstMembership,
    });
    await this.membershipRepository.save(membership);

    try {
      await this.notificationBootstrapService.bootstrapUserPreference({
        userId: user.id!,
        organizationId,
        timezone: organization.organization_timezone || null,
      });
      await this.notificationBootstrapService.bootstrapRolePreference({
        organizationId,
        role: userRole.name,
        roleId: userRole.id,
      });

      const userAccessList = await this.roleModuleAccessRepo.find({
        where: { organization_id: organizationId, role_id: roleId, is_access: true },
        relations: ["module", "action", "sub_action"],
      });
      const moduleAcessList = await this.roleModuleAccessService.prepareModuleData(userAccessList);

      if (isNewUser && user.emailVerificationToken) {
        await this.emailService.sendInviteEmail(user.email!, user.emailVerificationToken);
      }

      return { user, membership, module_list_access_by_user: moduleAcessList };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async verifyAndSetPassword(token: string, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      throw new Error("Invalid or expired token");
    }
    if (!user.emailVerificationExpires || user.emailVerificationExpires.getTime() < Date.now()) {
      throw new Error("Invitation link has expired. Please request a new invitation.");
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
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await this.userRepository.save(user);
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { resetPasswordToken: token } });
    if (!user) {
      throw new Error("Invalid reset token");
    }
    if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
      throw new Error("Reset token has expired");
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null;
    await this.userRepository.save(user);
  }

  async getAllUsers(query: PaginateQuery, currentUser?: any): Promise<Paginated<User>> {
    const selectQuery = this.userRepository.createQueryBuilder("user");

    const isMasterAdmin = currentUser?.role === Role.MASTER_ADMIN;

    if (!isMasterAdmin && currentUser?.organization_id) {
      // Non-master-admin callers are always scoped to their own org, from the
      // verified JWT claim — never from client-supplied filters, so one org's
      // admin can't view another org's users by tampering with the query.
      selectQuery
        .innerJoin(Membership, "membership", "membership.user_id = user.id")
        .andWhere("membership.organization_id = :orgId", { orgId: currentUser.organization_id });
    } else if (isMasterAdmin) {
      // Master Admin has no organization_id claim of its own (platform-level),
      // so its org scoping comes entirely from the "view as org" filter the
      // client sends (see OrganizationContext's selectedOrganizationId).
      const rawFilter = query.filter?.organization_id;
      const rawValue = Array.isArray(rawFilter) ? rawFilter[0] : rawFilter;
      const orgId = rawValue ? parseInt(String(rawValue).replace(/^\$eq:/, ""), 10) : undefined;
      if (orgId && !Number.isNaN(orgId)) {
        selectQuery
          .innerJoin(Membership, "membership", "membership.user_id = user.id")
          .andWhere("membership.organization_id = :orgId", { orgId });
      }
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      selectQuery.andWhere(`CONCAT(user."firstName", ' ', user."lastName") ILIKE :search`, { search: `%${search}%` });
    }

    return paginate(query as any, selectQuery, {
      filterableColumns: {
        isActive: [FilterOperator.IN],
      },
      sortableColumns: ["firstName", "lastName", "createdAt"],
      defaultSortBy: [["createdAt", "DESC"]],
      defaultLimit: 10,
    });
  }

  /**
   * Completes an admin-invited account (the "set your password" screen reached
   * via the invite email link). Gated by the same emailVerificationToken used
   * by verifyAndSetPassword — this is a public, pre-auth endpoint, so it must
   * never trust a bare `email` to identify whose account is being edited.
   */
  async editUserAccountDetail(updateDto: any): Promise<User> {
    const { token, firstName, password, lastName, phone } = updateDto;
    if (!token) {
      throw new Error("Invitation token is required");
    }

    const existingUser = await this.userRepository.findOne({ where: { emailVerificationToken: token } });
    if (!existingUser) {
      throw new Error("Invalid or expired invitation link");
    }
    if (!existingUser.emailVerificationExpires || existingUser.emailVerificationExpires.getTime() < Date.now()) {
      throw new Error("Invitation link has expired. Please request a new invitation.");
    }

    if (firstName !== undefined) existingUser.firstName = firstName;
    if (lastName !== undefined) existingUser.lastName = lastName;
    if (phone !== undefined) existingUser.phone = phone;
    if (password !== undefined) existingUser.password = password;
    existingUser.isActive = true;
    existingUser.emailVerificationToken = null;
    existingUser.emailVerificationExpires = null;

    existingUser.address = [];
    if (updateDto.address && Array.isArray(updateDto.address)) {
      updateDto.address.forEach((addr: UserAddress) => {
        existingUser.address!.push(this.userAddressRepository.create({ ...addr, user: existingUser }));
      });
    }

    existingUser.bank_account = [];
    if (updateDto.bank_account && Array.isArray(updateDto.bank_account)) {
      updateDto.bank_account.forEach((bankAccount: UserBankAccount) => {
        existingUser.bank_account!.push(this.bankAccountRepository.create({ ...bankAccount, user: existingUser }));
      });
    }

    return this.userRepository.save(existingUser);
  }

  async getUserProfileByToken(userToken: { token: string }): Promise<User> {
    const { token } = userToken;
    const existingUser = await this.userRepository.findOne({ where: { emailVerificationToken: token } });
    if (!existingUser) {
      throw new Error("Invalid token");
    }
    if (!existingUser.emailVerificationExpires || existingUser.emailVerificationExpires.getTime() < Date.now()) {
      throw new Error("Invitation link has expired");
    }
    return existingUser;
  }

  async reInviteUserById(userId: string): Promise<{ status: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { status: false, message: "Invalid User" };
    }

    const membership = await this.membershipRepository.findOne({
      where: { user_id: userId },
      relations: ["organization"],
      order: { createdAt: "ASC" },
    });

    if (membership?.organization) {
      if (membership.organization.is_archived) {
        return { status: false, message: "Cannot re-invite user to an archived organization" };
      }
      if (membership.organization.organization_status === "suspended") {
        return { status: false, message: "Cannot re-invite user to a suspended organization" };
      }
    }

    user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const expiryMinutes = parseInt(process.env.INVITE_TOKEN_EXPIRY_MINUTES || "480", 10);
    user.emailVerificationExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
    await this.userRepository.save(user);

    await this.emailService.sendInviteEmail(user.email!, user.emailVerificationToken);
    return { status: true, message: "Re-Invite Sent Successfully" };
  }

  async updateUserById(id: string, dto: UserUpdateDto, loginUser: User): Promise<{ status: boolean; message: string }> {
    if (
      dto.firstName || dto.lastName || dto.email || dto.password || dto.phone ||
      dto.dob !== undefined || dto.role !== undefined || dto.roleId !== undefined ||
      dto.isActive !== undefined || dto.external_user !== undefined
    ) {
      const regularUser = await this.userRepository.findOne({ where: { id } });
      if (!regularUser) {
        throw new Error(`User with id ${id} not found`);
      }
      this.userRepository.merge(regularUser, dto);
      await this.userRepository.save(regularUser);
    }

    if (loginUser.role === Role.MASTER_ADMIN && dto.module_list) {
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
            await this.roleModuleAccessRepo.update({ id: existingModuleAccess.id }, { is_access: module.is_access });
          }
        } else {
          assignModulesList.push(this.roleModuleAccessRepo.create({
            role_id: module.role_id,
            organization_id: module.organization_id,
            module_id: module.module_id,
            action_id: module.action_id,
            sub_action_id: module.sub_action_id,
            is_access: module.is_access,
          }));
        }
      }
      await this.roleModuleAccessRepo.save(assignModulesList);
      return { status: true, message: "All Records Updated Successfully" };
    }

    return { status: true, message: "User updated successfully" };
  }

  async getUserById(userId: string): Promise<UserCreateResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["bank_account", "address", "address.country"],
    });
    if (!user) {
      return undefined as any;
    }

    const membership = await this.membershipRepository.findOne({
      where: { user_id: userId, is_default: true },
      relations: ["organization"],
    });

    const userAccessList = membership
      ? await this.roleModuleAccessRepo.find({
        where: { organization_id: membership.organization_id, role_id: membership.roleId, is_access: true },
        relations: ["module", "action", "sub_action"],
      })
      : [];
    const moduleAcessList = await this.roleModuleAccessService.prepareModuleData(userAccessList);

    return { user, membership, module_list_access_by_user: moduleAcessList };
  }

  async getUsersByOrganizationId(organizationId: number) {
    const memberships = await this.membershipRepository.find({
      where: { organization_id: organizationId },
      relations: ["user"],
    });
    return memberships.map(m => m.user);
  }

  async saveFcmToken(userId: string, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.fcm_token = token;
      await this.userRepository.save(user);
      return { success: true, message: 'FCM token saved successfully' };
    }
    return { success: false, message: 'User not found' };
  }
}
