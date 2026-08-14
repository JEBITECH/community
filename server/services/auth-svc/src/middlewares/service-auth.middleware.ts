/**
 * Service Authentication Middleware for Auth Service
 *
 * Verifies service-to-service authentication tokens
 * and extracts signed user context
 */

import { Request, Response, NextFunction } from 'express';
import {
  verifyServiceAuth,
  extractUserContext,
  verifyServiceAuthWithHealthBypass,
} from '@shared/common/src/auth';

/**
 * Middleware to verify service authentication
 *
 * Apply this to ALL endpoints except health checks
 *
 * Usage:
 * ```typescript
 * app.use(serviceAuthMiddleware);
 * ```
 */
export const serviceAuthMiddleware = verifyServiceAuthWithHealthBypass;

/**
 * Middleware to extract user context
 *
 * Apply this AFTER serviceAuthMiddleware
 * Only for endpoints that require user context
 *
 * Usage:
 * ```typescript
 * app.use(serviceAuthMiddleware);
 * app.use(userContextMiddleware);
 * ```
 */
export const userContextMiddleware = extractUserContext;

/**
 * Combined middleware for protected endpoints
 *
 * Verifies both service auth and user context
 * Use this for endpoints that require authenticated user
 *
 * Usage:
 * ```typescript
 * import { requireAuthenticatedUser } from '@shared/common/src/auth';
 * app.use('/api/protected', requireAuthenticatedUser);
 * ```
 */
export { requireAuthenticatedUser } from '@shared/common/src/auth';
