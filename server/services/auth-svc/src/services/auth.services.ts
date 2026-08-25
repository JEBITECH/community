import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { JwtService } from './jwt.service';
import { AppDataSource } from '../db';
import * as crypto from 'crypto';
import { EmailService } from './email.service';
import { RoleModuleAccess } from '../entity/rolemoduleaccess.model';
import { RoleModuleAccessService } from './rolemoduleaccess.service';
import { ModuleResDto } from '../dto/moduleres.dto';
import { User, Membership, Organization, InvitationCode } from '@shared/entities';
import { Roles } from '../entity/roles.model';
import { Role } from '@shared/common';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyUserCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
export interface AuthLoginResponse {
  user: User;
  membership?: Membership | null;
  module_list_access_by_user?: ModuleResDto[];
  accessToken: string;
  refreshToken: string;
}

export interface OtpRequestResult {
  message: string;
  debug_otp?: string;
}

export interface OtpVerifyResult {
  isNewUser: boolean;
  otpVerifiedToken?: string;
  auth?: AuthLoginResponse;
}

export interface JoinCommunityDto {
  otpVerifiedToken: string;
  firstName: string;
  lastName?: string;
  unitIdentifier?: string;
  organizationId?: number;
  invitationCode?: string;
}

export interface JoinCommunityResult {
  status: 'active' | 'pending';
  user: User;
  membership: Membership;
  auth?: AuthLoginResponse;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_JOIN_TOKEN_EXPIRY = '10m';

export class AuthService {
  private userRepository: Repository<User>;
  private membershipRepository: Repository<Membership>;
  private organizationRepository: Repository<Organization>;
  private invitationCodeRepository: Repository<InvitationCode>;
  private jwtService: JwtService;
  private emailService: EmailService;
  private roleModuleAccessService: RoleModuleAccessService;
  private roleModuleAccessRepo: Repository<RoleModuleAccess>;
  private roleRepo: Repository<Roles>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.membershipRepository = AppDataSource.getRepository(Membership);
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.invitationCodeRepository = AppDataSource.getRepository(InvitationCode);
    this.jwtService = new JwtService();
    this.emailService = new EmailService();
    this.roleModuleAccessRepo = AppDataSource.getRepository(RoleModuleAccess);
    this.roleModuleAccessService = new RoleModuleAccessService();
    this.roleRepo = AppDataSource.getRepository(Roles);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, role = 'user', firstName, lastName, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    });
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = this.jwtService.generateTokenPair(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Resolves the membership a freshly-authenticated user should be scoped to:
   * their explicitly-marked default membership, falling back to their oldest
   * active membership. Returns null for Master Admin (platform-level, no org).
   */
  private async resolveActiveMembership(user: User): Promise<Membership | null> {
    if (user.role === Role.MASTER_ADMIN) {
      return null;
    }

    let membership = await this.membershipRepository.findOne({
      where: { user_id: user.id!, is_default: true, status: 'active' },
    });

    if (!membership) {
      membership = await this.membershipRepository.findOne({
        where: { user_id: user.id!, status: 'active' },
        order: { createdAt: 'ASC' },
      });
    }

    return membership;
  }

  private async resolveModuleAccess(user: User, membership: Membership | null): Promise<ModuleResDto[]> {
    if (user.role === Role.MASTER_ADMIN) {
      // Master Admin is not org-scoped; no module list returned (client grants full access statically).
      return [];
    }

    if (!membership) {
      return [];
    }

    let roleId = membership.roleId;
    if (!roleId) {
      const role = await this.roleRepo.findOne({
        where: { name: membership.role, organization_id: membership.organization_id }
      });
      if (role) {
        roleId = role.id;
        membership.roleId = role.id;
        await this.membershipRepository.save(membership);
      }
    }

    if (!roleId) {
      console.warn(`Membership ${membership.id} has no roleId assigned. Returning empty module access.`);
      return [];
    }

    const userAccessList = await this.roleModuleAccessRepo.find({
      where: {
        organization_id: membership.organization_id,
        role_id: roleId,
        is_access: true
      },
      relations: ['module', 'action', 'sub_action'],
    });

    return this.roleModuleAccessService.prepareModuleData(userAccessList);
  }

  async login(loginDto: LoginDto): Promise<AuthLoginResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const membership = await this.resolveActiveMembership(user);
    if (user.role !== Role.MASTER_ADMIN && !membership) {
      throw new Error('No active organization membership found for this account');
    }

    // Generate new tokens
    const tokens = this.jwtService.generateTokenPair(user, membership);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    const moduleAcessList = await this.resolveModuleAccess(user, membership);

    return {
      user,
      membership,
      module_list_access_by_user: moduleAcessList,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Request an OTP for phone-based login/registration (member-facing auth).
   * Creates an inactive placeholder User on first request for a brand-new
   * phone number; the account only becomes active once join-community (for
   * new numbers) or verifyOtp (for existing accounts) completes.
   */
  async requestOtp(phone: string): Promise<OtpRequestResult> {
    if (!phone?.trim()) {
      throw new Error('Phone number is required');
    }

    const now = new Date();
    let user = await this.userRepository.findOne({ where: { phone } });

    if (user?.otp_last_requested_at &&
      now.getTime() - user.otp_last_requested_at.getTime() < OTP_REQUEST_COOLDOWN_MS) {
      throw new Error('Please wait before requesting another OTP');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);

    if (!user) {
      user = this.userRepository.create({
        phone,
        firstName: 'New',
        lastName: 'Member',
        role: Role.INTERNAL_MEMBER,
        isActive: false,
      });
    }

    user.otp_code_hash = codeHash;
    user.otp_expires_at = new Date(now.getTime() + OTP_TTL_MS);
    user.otp_attempts = 0;
    user.otp_last_requested_at = now;
    await this.userRepository.save(user);

    if (process.env.NODE_ENV === 'production') {
      if (user.email) {
        try {
          await this.emailService.sendOtpEmail(user.email, code);
        } catch (err) {
          console.error('[AuthService] Failed to send OTP email:', err instanceof Error ? err.message : err);
        }
      }
      // TODO: integrate a real SMS/WhatsApp provider (e.g. Twilio, MSG91) here.
      console.log(`[AuthService] OTP generated for ${phone} (delivery channel pending SMS integration)`);
      return { message: 'OTP sent' };
    }

    console.log(`[DEV OTP] ${phone} -> ${code}`);
    return { message: 'OTP sent (dev mode)', debug_otp: code };
  }

  /**
   * Verifies an OTP. If the phone belongs to an existing, already-onboarded
   * account, logs them in directly. Otherwise returns a short-lived token the
   * client must present to /auth/join-community to finish registration.
   */
  async verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user || !user.otp_code_hash || !user.otp_expires_at) {
      throw new Error('No OTP requested for this number');
    }

    if (user.otp_expires_at.getTime() < Date.now()) {
      throw new Error('OTP has expired');
    }

    if (user.otp_attempts >= OTP_MAX_ATTEMPTS) {
      throw new Error('Too many attempts. Please request a new OTP.');
    }

    const matches = await bcrypt.compare(code, user.otp_code_hash);
    if (!matches) {
      user.otp_attempts += 1;
      await this.userRepository.save(user);
      throw new Error('Invalid OTP');
    }

    user.otp_code_hash = null;
    user.otp_expires_at = null;
    user.otp_attempts = 0;
    user.phone_verified = true;

    const membershipCount = await this.membershipRepository.count({ where: { user_id: user.id! } });

    if (membershipCount === 0) {
      // First time this phone has verified: needs to complete join-community
      // (pick/create an organization) before an account is fully usable.
      await this.userRepository.save(user);
      const otpVerifiedToken = jwt.sign(
        { phone, userId: user.id },
        process.env.JWT_ACCESS_SECRET || 'your-access-secret',
        { expiresIn: OTP_JOIN_TOKEN_EXPIRY, issuer: 'auth-service', audience: 'community-join' },
      );
      return { isNewUser: true, otpVerifiedToken };
    }

    user.isActive = true;
    await this.userRepository.save(user);

    const membership = await this.resolveActiveMembership(user);
    const tokens = this.jwtService.generateTokenPair(user, membership);
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    const moduleAcessList = await this.resolveModuleAccess(user, membership);

    return {
      isNewUser: false,
      auth: {
        user,
        membership,
        module_list_access_by_user: moduleAcessList,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  /**
   * Completes registration for a phone number that just verified its OTP:
   * creates the Membership for the chosen/invited organization. Status is
   * 'active' immediately for open/invite_only orgs (a valid code proves
   * authorization), or 'pending' for approval_required orgs.
   */
  async joinCommunity(dto: JoinCommunityDto): Promise<JoinCommunityResult> {
    let decoded: { phone: string; userId: string };
    try {
      decoded = jwt.verify(
        dto.otpVerifiedToken,
        process.env.JWT_ACCESS_SECRET || 'your-access-secret',
        { issuer: 'auth-service', audience: 'community-join' },
      ) as { phone: string; userId: string };
    } catch {
      throw new Error('OTP verification has expired, please verify your phone again');
    }

    const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    let organization: Organization | null = null;
    let invite: InvitationCode | null = null;

    if (dto.invitationCode) {
      invite = await this.invitationCodeRepository.findOne({ where: { code: dto.invitationCode } });
      if (!invite || invite.uses_count >= invite.max_uses ||
        (invite.expires_at && invite.expires_at.getTime() < Date.now())) {
        throw new Error('Invalid or expired invitation code');
      }
      organization = await this.organizationRepository.findOne({ where: { id: invite.organization_id } });
    } else if (dto.organizationId) {
      organization = await this.organizationRepository.findOne({ where: { id: dto.organizationId } });
    }

    if (!organization) {
      throw new Error('Organization not found');
    }

    if (organization.membership_model === 'invite_only' && !invite) {
      throw new Error('This organization requires an invitation code to join');
    }

    const existingMembership = await this.membershipRepository.findOne({
      where: { user_id: user.id!, organization_id: organization.id },
    });
    if (existingMembership) {
      throw new Error('You already have a membership in this organization');
    }

    const status: 'active' | 'pending' =
      organization.membership_model === 'approval_required' ? 'pending' : 'active';
    const isFirstMembership = (await this.membershipRepository.count({ where: { user_id: user.id! } })) === 0;

    user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    let membership = this.membershipRepository.create({
      user_id: user.id!,
      organization_id: organization.id,
      role: Role.INTERNAL_MEMBER,
      member_type: 'internal',
      unit_identifier: dto.unitIdentifier,
      status,
      joined_at: status === 'active' ? new Date() : undefined,
      is_default: isFirstMembership,
    });
    membership = await this.membershipRepository.save(membership);

    if (invite) {
      invite.uses_count += 1;
      await this.invitationCodeRepository.save(invite);
    }

    if (status !== 'active') {
      user.isActive = true; // account exists, just awaiting admin approval for this org
      await this.userRepository.save(user);
      return { status, user, membership };
    }

    user.isActive = true;
    const tokens = this.jwtService.generateTokenPair(user, membership);
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    return {
      status,
      user,
      membership,
      auth: {
        user,
        membership,
        module_list_access_by_user: [],
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  /** Backs the "one login, many communities" switcher. */
  async getMemberships(userId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { user_id: userId },
      relations: ['organization', 'organization.themeConfig'],
      order: { createdAt: 'ASC' },
    });
  }

  async switchOrganization(userId: string, organizationId: number): Promise<AuthLoginResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const membership = await this.membershipRepository.findOne({
      where: { user_id: userId, organization_id: organizationId, status: 'active' },
    });
    if (!membership) {
      throw new Error('No active membership found for that organization');
    }

    await this.membershipRepository.update({ user_id: userId }, { is_default: false });
    membership.is_default = true;
    await this.membershipRepository.save(membership);

    const tokens = this.jwtService.generateTokenPair(user, membership);
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    const moduleAcessList = await this.resolveModuleAccess(user, membership);

    return {
      user,
      membership,
      module_list_access_by_user: moduleAcessList,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh access token using valid refresh token
   * Validates refresh token and generates new token pair
   * @throws Error if refresh token is invalid or user not found
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      //  refresh token signature and expiration
      const decoded = this.jwtService.verifyRefreshToken(refreshToken);

      // Find user and validate stored refresh token matches
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId, refreshToken }
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      const membership = await this.resolveActiveMembership(user);

      // Generate new token pair
      const tokens = this.jwtService.generateTokenPair(user, membership);

      // Update refresh token in database
      user.refreshToken = tokens.refreshToken;
      await this.userRepository.save(user);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = this.jwtService.verifyAccessToken(token);
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId, isActive: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async resetPassword(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await this.userRepository.save(user);

    try {
      await this.emailService.sendResetPasswordEmail(email, resetToken);
    } catch (error) {
      throw new Error('Failed to send reset email');
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {


    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
      }
    });

    if (!user) {
      throw new Error('Invalid reset token');
    }

    const now = new Date();
    if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < now.getTime()) {
      throw new Error('Reset token has expired');
    }

    user.password = newPassword; // Will be hashed by @BeforeUpdate
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // Invalidate all sessions

    await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    const user = await this.userRepository.find();
    if (!user) {
      throw new Error('No User Exists!');
    }
    return user;
  }

  // Find user by email (for JWT strategy)
  async findByEmail(email: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return null;
    }

    // Return user without sensitive data
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      roleId: user.roleId,
      is_active: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Find user by ID
  async findById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      return null;
    }

    // Return user without sensitive data
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      roleId: user.roleId,
      is_active: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Verify user credentials (for Local strategy)
  async verifyUser(credentials: VerifyUserCredentials): Promise<any> {
    const { email, password } = credentials;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Return user without sensitive data
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      roleId: user.roleId,
      is_active: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }


}
