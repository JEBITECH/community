/**
 * Service-to-Service Authentication
 *
 * Provides JWT-based authentication between microservices to prevent
 * unauthorized access and header spoofing.
 *
 * Usage:
 * - Gateway: Generate service token and sign user context
 * - Services: Verify service token and user context
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Environment variables required
const SERVICE_JWT_SECRET = process.env.SERVICE_JWT_SECRET || '';
const USER_CONTEXT_SECRET = process.env.USER_CONTEXT_SECRET || '';

// Validate secrets are set
if (!SERVICE_JWT_SECRET || SERVICE_JWT_SECRET.length < 32) {
  console.error('❌ SERVICE_JWT_SECRET must be set and at least 32 characters');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SERVICE_JWT_SECRET is required in production');
  }
}

if (!USER_CONTEXT_SECRET || USER_CONTEXT_SECRET.length < 32) {
  console.error('❌ USER_CONTEXT_SECRET must be set and at least 32 characters');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('USER_CONTEXT_SECRET is required in production');
  }
}

/**
 * Service identity for internal communication
 */
export enum ServiceName {
  GATEWAY = 'gateway',
  AUTH = 'auth-service',
  ACCOUNTING = 'accounting-service',
  DATA_IMPORT = 'data-import-service',
  VIRTUAL_INSPECT = 'virtual-inspect-service',
  AUDIT_LOG = 'audit-log-service',
  DIGITAL_HANDBOOK = 'digital-handbook-service',
  BOOKING_ENGINE = 'booking-engine-service'
}

/**
 * Service token payload
 */
export interface ServiceTokenPayload {
  service: ServiceName;
  scope: string[];
  iat?: number;
  exp?: number;
}

/**
 * User context for cross-service communication
 */
export interface UserContext {
  id: string;
  email: string;
  role: string;
  organization_id: string;
}

/**
 * Generate a service token for internal API calls
 *
 * @param service - Name of the calling service
 * @param scope - Array of permissions (e.g., ['read:users', 'write:audit'])
 * @returns Signed JWT token
 */
export function generateServiceToken(
  service: ServiceName,
  scope: string[] = ['internal']
): string {
  const payload: ServiceTokenPayload = {
    service,
    scope,
  };

  return jwt.sign(payload, SERVICE_JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'erp-internal',
    audience: 'erp-services',
  });
}

/**
 * Verify a service token
 *
 * @param token - Service JWT token
 * @returns Decoded payload or null if invalid
 */
export function verifyServiceToken(token: string): ServiceTokenPayload | null {
  try {
    const payload = jwt.verify(token, SERVICE_JWT_SECRET, {
      issuer: 'erp-internal',
      audience: 'erp-services',
    }) as ServiceTokenPayload;

    return payload;
  } catch (error) {
    console.error('Service token verification failed:', error);
    return null;
  }
}

/**
 * Sign user context for secure propagation across services
 *
 * @param user - User context to sign
 * @returns Signed JWT token containing user data
 */
export function signUserContext(user: UserContext): string {
  return jwt.sign(user, USER_CONTEXT_SECRET, {
    expiresIn: '5m', // Short-lived, only for request duration
    issuer: 'erp-gateway',
    audience: 'erp-services',
  });
}

/**
 * Verify and decode user context token
 *
 * @param token - Signed user context JWT
 * @returns User context or null if invalid
 */
export function verifyUserContext(token: string): UserContext | null {
  try {
    const user = jwt.verify(token, USER_CONTEXT_SECRET, {
      issuer: 'erp-gateway',
      audience: 'erp-services',
    }) as UserContext;

    return user;
  } catch (error) {
    console.error('User context verification failed:', error);
    return null;
  }
}

/**
 * Express middleware to verify service authentication
 *
 * Checks for valid service token in x-service-token header
 * Attaches service identity to request object
 *
 * Usage:
 * ```typescript
 * app.use(verifyServiceAuth);
 * ```
 */
export function verifyServiceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceToken = req.headers['x-service-token'] as string;

  if (!serviceToken) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Service token required for internal API access',
    });
    return;
  }

  const payload = verifyServiceToken(serviceToken);

  if (!payload) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired service token',
    });
    return;
  }

  // Attach service identity to request
  (req as any).service = payload;

  console.log(`✅ Service authenticated: ${payload.service}`);
  next();
}

/**
 * Express middleware to verify and extract user context
 *
 * Checks for signed user context in x-user-token header
 * Attaches user to request object
 *
 * Usage:
 * ```typescript
 * app.use(verifyServiceAuth); // Must be called first
 * app.use(extractUserContext);
 * ```
 */
export function extractUserContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userToken = req.headers['x-user-token'] as string;

  if (!userToken) {
    // Some endpoints may not require user context (e.g., health checks)
    console.log('ℹ️  No user context provided (ok for public endpoints)');
    next();
    return;
  }

  const user = verifyUserContext(userToken);

  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired user context',
    });
    return;
  }

  // Attach user to request
  (req as any).user = user;

  console.log(`✅ User context verified: ${user.email} (org: ${user.organization_id})`);
  next();
}

/**
 * Combined middleware for full service authentication
 *
 * Verifies both service token and user context
 * Use this for endpoints that require authenticated user
 *
 * Usage:
 * ```typescript
 * app.use('/api/protected', requireAuthenticatedUser);
 * ```
 */
export function requireAuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceToken = req.headers['x-service-token'] as string;
  const userToken = req.headers['x-user-token'] as string;

  if (!serviceToken) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Service token required',
    });
    return;
  }

  if (!userToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'User authentication required',
    });
    return;
  }

  const servicePayload = verifyServiceToken(serviceToken);
  const user = verifyUserContext(userToken);

  if (!servicePayload || !user) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid authentication credentials',
    });
    return;
  }

  // Attach both to request
  (req as any).service = servicePayload;
  (req as any).user = user;

  next();
}

/**
 * Health check middleware (bypasses service auth)
 *
 * Use for health check endpoints that should be accessible without auth
 */
export function isHealthCheck(req: Request): boolean {
  return req.path.includes('/health') || req.path === '/';
}

/**
 * Middleware to optionally skip service auth for health checks
 */
export function verifyServiceAuthWithHealthBypass(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (isHealthCheck(req)) {
    console.log('ℹ️  Health check - bypassing service auth');
    next();
    return;
  }

  verifyServiceAuth(req, res, next);
}
