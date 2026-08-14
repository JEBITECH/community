import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwt.service';
import { AuthService } from '../services/auth.services';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export class AuthMiddleware {
  private jwtService: JwtService;
  private authService: AuthService;

  constructor() {
    this.jwtService = new JwtService();
    this.authService = new AuthService();
  }

  // Middleware to verify JWT token
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }

      const token = authHeader.split(' ')[1]; // Bearer <token>
      
      if (!token) {
        return res.status(401).json({ error: 'Token missing' });
      }

      // Verify token and get user
      const user = await this.authService.verifyToken(token);
      req.user = user;
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // Middleware to check user roles
  authorize = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  };

  // Optional authentication (doesn't fail if no token)
  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          const user = await this.authService.verifyToken(token);
          req.user = user;
        }
      }
      
      next();
    } catch (error) {
      // Continue without user if token is invalid
      next();
    }
  };
}

export const authMiddleware = new AuthMiddleware();