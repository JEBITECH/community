// guards/jwt-auth-guard.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organization_id?: string;
      };
    }
  }
}

class JwtAuthGuard {
  // Routes that don't require authentication. Guest/community-public traffic is
  // namespaced under /api/community/public/* server-side so a single wildcard
  // entry covers it, rather than scattering per-endpoint public exceptions.
  private readonly publicRoutes = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/auth/confirm-password-reset',
    '/api/auth/user/reset-password',
    '/api/auth/user/user-by-token',
    '/api/auth/user/edit-user',
    '/api/auth/otp/request',
    '/api/auth/otp/verify',
    '/api/auth/join-community',
    '/api/auth/organizations/check-subdomain',
    '/api/auth/organizations/check-subdomain/*',
    '/api/auth/organizations/by-subdomain',
    '/api/auth/organizations/by-subdomain/*',
    '/api/community/public',
    '/api/community/public/*',
    '/health',
    '/api-docs',
    '/api-docs/*',
    '/api/api-docs',
    '/api/api-docs/*',
    '/swagger.json',
    '/api/swagger.json',
  ];

  constructor() { }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const originalUrl = req.originalUrl;

    // Check if it's a public route first
    if (this.isPublicRoute(originalUrl)) {
      return next();
    }

    const token = this.extractTokenFromHeader(req);

    if (!token) {
      res.status(401).json({ message: 'Unauthorized, token is not provided' });
      return;
    }

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as any;

      // Attach user to request object
      req.user = {
        id: payload.userId,        // For AuthenticatedRequest
        email: payload.email,
        role: payload.role,
        organization_id: payload.organizationId
      };
      next();
    } catch (error: any) {
      res.status(401).json({ message: 'Unauthorized, token is expired or invalid' });
    }
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractTokenFromHeader(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Check if the current route is a public route
   */
  private isPublicRoute(url: string): boolean {
    // Strip query string for matching
    const urlPath = url.split('?')[0];

    return this.publicRoutes.some(publicRoute => {
      // Wildcard route (e.g. /api-docs/*)
      if (publicRoute.endsWith('*')) {
        const base = publicRoute.slice(0, -1);
        return urlPath.startsWith(base);
      }

      // Exact match (ignoring query params)
      return urlPath === publicRoute;
    });
  }
}

export default JwtAuthGuard;
