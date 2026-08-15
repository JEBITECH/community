import { Request, Response } from 'express';
import { AuthService } from '../services/auth.services';
import rateLimit from 'express-rate-limit';
import { JsonController, Post, Body, Get, Res, Req, UseBefore } from 'routing-controllers';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { LoginUserDto } from '../dto/user.dto';
import { authValidationSchemas, validateRequest } from '../middlewares/validation';
import { authRateLimiter } from '../middlewares/authRateLimiter';

interface RequestOtpBody {
  phone: string;
}

interface VerifyOtpBody {
  phone: string;
  code: string;
}

interface JoinCommunityBody {
  otpVerifiedToken: string;
  firstName: string;
  lastName?: string;
  unitIdentifier?: string;
  organizationId?: number;
  invitationCode?: string;
}

interface SwitchOrgBody {
  organizationId: number;
}

@JsonController('/auth')
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Rate limiting for auth endpoints
  static authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // 500 attempts per window
    message: {
      error: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  };

  @Post('/login')
  @UseBefore(authRateLimiter)
  @UseBefore(validateRequest(authValidationSchemas.login))
  async login(@Body() loginDto: LoginUserDto, @Res() res: Response) {
    try {
      const { email, password } = loginDto;
      const result = await this.authService.login({ email, password });
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      return res.json({
        message: 'Login successful',
        user: result.user,
        module_list_access_by_user: result.module_list_access_by_user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      return res.status(401).json({
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  };

  @Post('/otp/request')
  @UseBefore(authRateLimiter)
  async requestOtp(@Body() body: RequestOtpBody, @Res() res: Response) {
    try {
      const result = await this.authService.requestOtp(body.phone);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      });
    }
  }

  @Post('/otp/verify')
  @UseBefore(authRateLimiter)
  async verifyOtp(@Body() body: VerifyOtpBody, @Res() res: Response) {
    try {
      const result = await this.authService.verifyOtp(body.phone, body.code);

      if (result.isNewUser) {
        return res.json({
          isNewUser: true,
          otpVerifiedToken: result.otpVerifiedToken,
        });
      }

      res.cookie('refreshToken', result.auth!.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        isNewUser: false,
        message: 'Login successful',
        ...result.auth,
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'OTP verification failed'
      });
    }
  }

  @Post('/join-community')
  async joinCommunity(@Body() body: JoinCommunityBody, @Res() res: Response) {
    try {
      const result = await this.authService.joinCommunity(body);

      if (result.status === 'pending') {
        return res.json({
          status: 'pending',
          message: 'Your request has been submitted and is awaiting admin approval',
          membership: result.membership,
        });
      }

      res.cookie('refreshToken', result.auth!.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        status: 'active',
        message: 'Joined successfully',
        ...result.auth,
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to join community'
      });
    }
  }

  @Get('/me/memberships')
  async getMyMemberships(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const userId = req.user?.id || req.user;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const memberships = await this.authService.getMemberships(userId);
      return res.json({ memberships });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to fetch memberships'
      });
    }
  }

  @Post('/me/switch-org')
  async switchOrg(@Req() req: AuthenticatedRequest, @Body() body: SwitchOrgBody, @Res() res: Response) {
    try {
      const userId = req.user?.id || req.user;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const result = await this.authService.switchOrganization(userId, body.organizationId);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        message: 'Switched organization successfully',
        ...result,
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to switch organization'
      });
    }
  }

  @Post('/refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      // Get refresh token from cookie or body
      const cookies = (req as any).cookies || {};
      const body = (req as any).body || {};
      const refreshToken = cookies.refreshToken || body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token not provided' });
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      // Update refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      return res.json({
        message: 'Tokens refreshed successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      return res.status(401).json({
        error: error instanceof Error ? error.message : 'Token refresh failed'
      });
    }
  }

  @Post('/logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const userId = req.user?.id || req.user;

      if (userId) {
        await this.authService.logout(userId);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });

      return res.json({ message: 'Logout successful' });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Logout failed'
      });
    }
  }

  // Endpoint for other microservices to verify tokens
  verifyToken = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token missing' });
      }

      const user = await this.authService.verifyToken(token);

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(401).json({
        valid: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      });
    }
  };

  @Get('/all-user')
  async getAllUsers(@Body() reqDto: AuthenticatedRequest, @Res() res: Response) {
    try {
      const result = await this.authService.getAllUsers();
      return res.json({
        user: result
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get profile'
      });
    }
  };

  @Get('/user-profile')
  async getProfile(@Body() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      return res.json({
        user: req.user
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get profile'
      });
    }
  };

  @Post('/reset-password')
  async resetPassword(@Body() req: { email: string }, @Res() res: Response) {
    try {
      const { email } = req;
      await this.authService.resetPassword(email);

      return res.json({
        message: 'Password reset instructions sent to your email'
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Password reset failed'
      });
    }
  };

  @Post('/confirm-password-reset')
  async confirmPasswordReset(
    @Body() req: { token: string; password: string },
    @Res() res: Response
  ) {
    try {

      const { token, password } = req;
      await this.authService.confirmPasswordReset(token, password);

      return res.json({
        message: 'Password reset successful'
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Password reset confirmation failed'
      });
    }
  };
}