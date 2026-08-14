import { Repository } from 'typeorm';
import { JwtService } from './jwt.service';
import { AppDataSource } from '../db';
import * as crypto from 'crypto';
import { EmailService } from './email.service';
import { RoleModuleAccess } from '../entity/rolemoduleaccess.model';
import { RoleModuleAccessService } from './rolemoduleaccess.service';
import { ModuleResDto } from '../dto/moduleres.dto';
import { User } from '@shared/entities';
import { Roles } from '../entity/roles.model';

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
  module_list_access_by_user?: ModuleResDto[];
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private jwtService: JwtService;
  private emailService: EmailService;
  private roleModuleAccessService: RoleModuleAccessService;
  private roleModuleAccessRepo: Repository<RoleModuleAccess>;
  private roleRepo: Repository<Roles>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
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

    // Generate new tokens
    const tokens = this.jwtService.generateTokenPair(user);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    let moduleAcessList: ModuleResDto[] = [];

    if (user.role === 'platformOwner') {
      // platformOwner is not org-scoped; no module list returned
    } else {
      // All other roles (super_admin, custom roles) derive access from ACL rows.
      // Resolve roleId from the roles table if it isn't stored on the user record.
      if (!user.roleId) {
        const role = await this.roleRepo.findOne({
          where: { name: user.role, organization_id: user.organization_id }
        });
        if (role) user.roleId = role.id;
      }

      if (user.roleId) {
        const userAccessList = await this.roleModuleAccessRepo.find({
          where: {
            organization_id: user.organization_id,
            role_id: user.roleId,
            is_access: true
          },
          relations: ['module', 'action', 'sub_action'],
        });
        moduleAcessList = await this.roleModuleAccessService.prepareModuleData(userAccessList);
      } else {
        console.warn(`User ${user.email} has no roleId assigned. Returning empty module access.`);
      }
    }

    return {
      user,
      module_list_access_by_user: moduleAcessList,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
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

      // Generate new token pair
      const tokens = this.jwtService.generateTokenPair(user);

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
      organization_id: user.organization_id,
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
      organization_id: user.organization_id,
      roleId: user.roleId,
      client_id: user.organization_id,
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
      organization_id: user.organization_id,
      roleId: user.roleId,
      client_id: user.organization_id,
      is_active: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }


}