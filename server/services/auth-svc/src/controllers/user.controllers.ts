import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { RegisterDto, UserService } from '../services/user.services';
import { Body, Get, JsonController, Param, Patch, Post, Put, Res, Req, UseBefore } from 'routing-controllers';
import { UserUpdateDto } from '../dto/userupdate.dto';
import { AuthService } from '../services/auth.services';
import { OrganizationService } from '../services/organization.service';
import { Paginate, PaginateQuery } from '@shared/common';

@JsonController('/auth/user')
export class UserController {
  private userService: UserService;
  private authService: AuthService;
  private organizationService: OrganizationService;

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService();
    this.organizationService = new OrganizationService();
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
  @Param('organizationId') organizationId: number,
  @Res() res: Response
) {
  try {
    const result = await this.userService.getUsersByOrganizationId(Number(organizationId));
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
  setUserAccountPassword = async (req: any, res: any) => {
    try {
      const result = await this.userService.verifyAndSetPassword(req.body.token, req.body.newPassword);
      res.json({
        result: result
      })
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to verify user'
      });
    }
  }

  @Patch('/edit-user')
  async editUserDetail(@Body() req: any, @Res() res: any) {
    try {
      const requestData = req;
      const result = await this.userService.editUserAccountDetail(requestData);
      if(result){
        await this.organizationService.updateOrganizationStatus(result.organization_id, 'onboarded');
      }
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