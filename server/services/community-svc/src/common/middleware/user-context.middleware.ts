import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const USER_CONTEXT_SECRET = process.env.USER_CONTEXT_SECRET || 'dev-secret-change-in-production';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  organization_id: number | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

/**
 * Verifies the signed x-user-token the gateway forwards (see gateway's
 * signUserContext). No insecure fallback to a raw/unsigned header — this is a
 * new service, so it doesn't inherit auth-svc's legacy compatibility need.
 */
@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const token = req.headers['x-user-token'] as string | undefined;
    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, USER_CONTEXT_SECRET, {
        issuer: 'community-gateway',
        audience: 'community-services',
      }) as { id: string; email: string; role: string; organization_id?: number };

      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        organization_id: payload.organization_id ?? null,
      };
    } catch {
      // Invalid/expired signed context — leave req.user unset; guards downstream
      // will reject the request as unauthenticated.
    }

    next();
  }
}
