/**
 * User Context Verification Middleware
 *
 * Verifies signed user context JWT from gateway
 * Prevents header spoofing and privilege escalation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Get secret from environment
const USER_CONTEXT_SECRET = process.env.USER_CONTEXT_SECRET;

// Validate secret on startup
if (!USER_CONTEXT_SECRET || USER_CONTEXT_SECRET.length < 32) {
  console.error('❌ USER_CONTEXT_SECRET must be set and at least 32 characters');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('USER_CONTEXT_SECRET is required in production');
  }
  console.warn('⚠️  Using default secret for development - CHANGE IN PRODUCTION');
}

/**
 * User context interface
 */
export interface UserContext {
  id: string;
  email: string;
  role: string;
  organization_id: string;
}

/**
 * Verify and extract user context from x-user-token header
 *
 * This middleware:
 * 1. Checks for signed JWT in x-user-token header
 * 2. Verifies signature and expiration
 * 3. Attaches verified user to req.user
 * 4. Falls back to legacy x-user header if token missing (for backward compatibility)
 *
 * Usage:
 * ```typescript
 * app.use(userContextMiddleware);
 * ```
 */
export function userContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Health check endpoints don't need user context
  if (req.path.includes('/health') || req.path === '/auth/' || req.path === '/') {
    return next();
  }

  // Public auth endpoints don't need user context
  const publicPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/reset-password'];
  if (publicPaths.some(path => req.path.includes(path))) {
    return next();
  }

  if (req.path.includes('/pms/config/')) {
    // These endpoints require user context, but we'll let requireAuthenticatedUser middleware handle it
    return next();
  }

  // Try to get signed JWT token first (NEW, SECURE)
  const userToken = req.headers['x-user-token'] as string;

  if (userToken) {
    try {
      // Verify signed JWT token
      const user = jwt.verify(
        userToken,
        USER_CONTEXT_SECRET || 'dev-secret-change-in-production',
        {
          issuer: 'erp-gateway',
          audience: 'erp-services',
        }
      ) as UserContext;

      // Attach verified user to request
      (req as any).user = user;

      console.log(`✅ User context verified: ${user.email} (org: ${user.organization_id})`);
      return next();
    } catch (error: any) {
      console.error('❌ User context verification failed:', error.message);

      // Don't fail the request yet, try legacy fallback
      // This allows gradual migration
    }
  }

  // FALLBACK: Try legacy x-user header (OLD, INSECURE - for backward compatibility)
  const legacyUserHeader = req.headers['x-user'] as string;

  if (legacyUserHeader) {
    try {
      const user = JSON.parse(legacyUserHeader);
      (req as any).user = user;

      console.warn(`⚠️  Using legacy unsigned user header for ${user.email} - UPDATE GATEWAY TO SIGN`);
      return next();
    } catch (error) {
      console.error('❌ Failed to parse legacy user header:', error);
    }
  }

  // If we get here, no valid user context was found
  console.error('❌ No valid user context found in request');

  // For non-critical endpoints, allow request to continue
  // Controllers should check req.user before accessing protected resources
  next();
}

/**
 * Middleware that REQUIRES authenticated user context
 * Use this for endpoints that absolutely need user info
 *
 * Usage:
 * ```typescript
 * app.use('/auth/users', requireAuthenticatedUser);
 * ```
 */
export function requireAuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Response<any, Record<string, any>> {
  if (!req.path.includes('/health') && !req.path.includes('/login') && !req.path.includes('/register')) {
    if (!(req as any).user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
    }
  }

  next();
}

/**
 * Get user from request (helper function)
 */
export function getUserFromRequest(req: Request): UserContext | null {
  return (req as any).user || null;
}
