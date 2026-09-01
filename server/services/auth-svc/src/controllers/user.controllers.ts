import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { RegisterDto, UserService } from '../services/user.services';
import { Body, Get, JsonController, Param, Patch, Post, Put, Res, Req, UseBefore } from 'routing-controllers';
import { UserUpdateDto } from '../dto/userupdate.dto';
import { AuthService } from '../services/auth.services';
import { Paginate, PaginateQuery, Role } from '@shared/common';

@JsonController('/auth/user')
export class UserController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  // Rate limiting for auth endpoints
  static userRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 5 attempts per window
    message: {
      error: 'Too many user attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  @Post('/invite-user')
  async createUser(@Body() req: RegisterDto, @Res() res: Response) {
    try {
      const result = await this.userService.createUser(req);
      return res.status(201).json({
        message: 'User created and invited successfully',
        user: result
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  };

  @Get('/all-user')
  async getAllUsers(
    @Paginate paginate: PaginateQuery,
    @Req() req: Request,
    @Res() res: Response) {
    try {
      const user = JSON.parse(req.headers['x-user'] as string);
      const result = await this.userService.getAllUsers(paginate, user);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get profile'
      });
    }
  };

@Get('/organization/:organizationId')
async getUsersByOrganizationId(
  @Req() req: Request,
  @Param('organizationId') organizationId: number,
  @Res() res: Response
) {
  const role = req.headers['x-user-role'] as string | undefined;
  const rawOrgId = req.headers['x-user-organization-id'];
  const callerOrgId = Number(Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId);
  const requestedOrgId = Number(organizationId);

  if (role !== Role.MASTER_ADMIN && !(role === Role.SUPER_ADMIN && callerOrgId === requestedOrgId)) {
    return res.status(403).json({ error: 'You are not allowed to view users in this organization' });
  }

  try {
    const result = await this.userService.getUsersByOrganizationId(requestedOrgId);
    return res.json({ users: result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get users by organization',
    });
  }
}

  @Post('/user-by-token')
  async getUserByToken(@Body() req: any, @Res() res: any) {
    try {
      const result = await this.userService.getUserProfileByToken(req);
      return res.json({
        user: result
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get profile'
      });
    }
  }

  @Post('/profile')
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
  async setUserAccountPassword(@Body() req: any, @Res() res: Response) {
    try {
      const result = await this.userService.verifyAndSetPassword(req.token, req.newPassword);
      return res.json({
        result: result
      })
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to verify user'
      });
    }
  }

  @Patch('/edit-user')
  async editUserDetail(@Body() req: any, @Res() res: any) {
    try {
      const result = await this.userService.editUserAccountDetail(req);
      return res.json({
        result: result
      })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to verify user'
      });
    }
  }

  @Get('/reinvite-user/:userId')
  async reInviteUser(@Param("userId") userId: string, @Res() res: Response) {
    try {
      const result = await this.userService.reInviteUserById(userId);
      return res.status(result.status ? 201 : 200).json(result);
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Re-Invite Failed'
      });
    }
  }

  @Put('/fcm-token')
  async saveFcmToken(
    @Req() req,
    @Body() dto: {fcm_token: string},
  ) {
    return this.userService.saveFcmToken(
      req.user.id,
      dto.fcm_token,
    );
  }

  @Put('/:id')
  async updateUserById(@Param('id') id: string, @Body() dto: UserUpdateDto, @Req() req: Request, @Res() res: Response) {
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
      const regularUser = await this.userService.updateUserById(id, dto, user);
      return res.status(201).json(regularUser);

    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Get('/:id')
  async findUserById(@Param("id") id: string, @Res() res: Response) {
    try {
      const user = await this.userService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "Not Found" });
      }
      return res.status(200).json(user);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}