/**
 * Authentication Utilities
 *
 * Provides service-to-service authentication and user context verification
 */

export {
  ServiceName,
  ServiceTokenPayload,
  UserContext,
  generateServiceToken,
  verifyServiceToken,
  signUserContext,
  verifyUserContext,
  verifyServiceAuth,
  extractUserContext,
  requireAuthenticatedUser,
  verifyServiceAuthWithHealthBypass,
  isHealthCheck,
} from './service-auth';
