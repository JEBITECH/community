import { EmailService } from '../../src/services/email.service';
import { 
  createTestUser, 
  createTestRegisterDto, 
  createTestLoginDto,
  createTestModuleResDto
} from '../helpers/test-utils';
import { AppDataSource } from '../../src/db';
import { RoleModuleAccessService } from '../../src/services/rolemoduleaccess.service';
import { JwtService } from '../../src/services/jwt.service';
import { AuthService } from '../../src/services/auth.services';

// Mock dependencies
jest.mock('../../src/db', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('../../src/services/jwt.service');
jest.mock('../../src/services/email.service');
jest.mock('../../src/services/rolemoduleaccess.service');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockRoleModuleAccessService: jest.Mocked<RoleModuleAccessService>;
  let mockRoleModuleAccessRepo: any;

  beforeEach(() => {
    // Setup mock repositories
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn()
    };

    mockRoleModuleAccessRepo = {
      find: jest.fn()
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockUserRepository)  // For User repository
      .mockReturnValueOnce(mockRoleModuleAccessRepo); // For RoleModuleAccess repository

    mockJwtService = new JwtService() as jest.Mocked<JwtService>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;
    mockRoleModuleAccessService = new RoleModuleAccessService() as jest.Mocked<RoleModuleAccessService>;

    authService = new AuthService();
    
    // Override the injected dependencies with our mocks
    (authService as any).jwtService = mockJwtService;
    (authService as any).emailService = mockEmailService;
    (authService as any).roleModuleAccessService = mockRoleModuleAccessService;
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = createTestRegisterDto();
      const testUser = createTestUser();
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(testUser);
      mockUserRepository.save.mockResolvedValue(testUser);
      mockJwtService.generateTokenPair.mockReturnValue(tokens);

      const result = await authService.register(registerDto);

      expect(result.user).toEqual(testUser);
      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.refreshToken).toBe(tokens.refreshToken);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2); // Once for user, once for refresh token
    });

    it('should throw error if user already exists', async () => {
      const registerDto = createTestRegisterDto();
      const existingUser = createTestUser();

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = createTestLoginDto();
      const testUser = createTestUser();
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      const moduleAccessList = [createTestModuleResDto()];

      mockUserRepository.findOne.mockResolvedValue(testUser);
      mockJwtService.generateTokenPair.mockReturnValue(tokens);
      mockRoleModuleAccessRepo.find.mockResolvedValue([]);
      mockRoleModuleAccessService.prepareModuleData.mockResolvedValue(moduleAccessList);

      const result = await authService.login(loginDto);

      expect(result.user).toEqual(testUser);
      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.refreshToken).toBe(tokens.refreshToken);
      expect(result.module_list_access_by_user).toEqual(moduleAccessList);
      expect(testUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
    });

    it('should throw error with invalid credentials', async () => {
      const loginDto = createTestLoginDto();

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is inactive', async () => {
      const loginDto = createTestLoginDto();
      const inactiveUser = createTestUser({ isActive: false });

      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(authService.login(loginDto)).rejects.toThrow('Account is deactivated');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const testUser = createTestUser({ refreshToken: oldRefreshToken });
      const newTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      mockJwtService.verifyRefreshToken.mockReturnValue({ userId: testUser.id });
      mockUserRepository.findOne.mockResolvedValue(testUser);
      mockJwtService.generateTokenPair.mockReturnValue(newTokens);

      const result = await authService.refreshToken(oldRefreshToken);

      expect(result).toEqual(newTokens);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...testUser,
        refreshToken: newTokens.refreshToken
      });
    });

    it('should throw error with invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid-token';

      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(invalidRefreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });



  
});