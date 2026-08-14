/**
 * Secure Proxy Utilities for Gateway
 *
 * Provides secure service-to-service communication with:
 * - Service token generation
 * - Signed user context
 * - Request/response logging
 */

import { Request } from 'express';
import { Options } from 'express-http-proxy';
import {
  generateServiceToken,
  signUserContext,
  ServiceName,
  UserContext,
} from '@shared/common/src/auth';

/**
 * Create secure proxy options for a backend service
 *
 * Automatically adds:
 * - x-service-token: JWT for service authentication
 * - x-user-token: Signed user context (if user present)
 * - x-request-id: Request tracking
 * - service-name: Legacy header for compatibility
 *
 * @param serviceName - Name of the target service
 * @param pathResolver - Function to resolve backend path
 * @returns Express-http-proxy options object
 */
export function createSecureProxyOptions(
  serviceName: ServiceName,
  pathResolver: (req: Request) => string
): Options {
  // Generate service token once (reuse for all requests)
  // In production, refresh this periodically (e.g., every 30 minutes)
  const serviceToken = generateServiceToken(serviceName, ['internal']);

  return {
    proxyReqPathResolver: pathResolver,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers = proxyReqOpts.headers || {};

      // Add service authentication token
      proxyReqOpts.headers['x-service-token'] = serviceToken;

      // Sign and add user context if present
      if ((srcReq as any).user) {
        const user: UserContext = (srcReq as any).user;

        // Sign user context as JWT
        const userToken = signUserContext(user);
        proxyReqOpts.headers['x-user-token'] = userToken;

        // Legacy headers (for gradual migration)
        proxyReqOpts.headers['x-user-id'] = user.id;
        proxyReqOpts.headers['x-user-email'] = user.email;
        proxyReqOpts.headers['x-user-role'] = user.role;
        proxyReqOpts.headers['x-user-organization-id'] = user.organization_id;

        console.log(`🔐 Proxying request for user: ${user.email} to ${serviceName}`);
      } else {
        console.log(`🔓 Proxying public request to ${serviceName}`);
      }

      // Add request tracking
      if ((srcReq as any).requestId) {
        proxyReqOpts.headers['x-request-id'] = (srcReq as any).requestId;
      }

      // Legacy service name header
      proxyReqOpts.headers['service-name'] = serviceName;

      // Forward cookies if present
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
      }

      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      // Forward set-cookie headers
      const setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        userRes.setHeader('Set-Cookie', setCookie);
      }

      // Log response status
      console.log(`✅ ${serviceName} responded: ${proxyRes.statusCode}`);

      return proxyResData;
    },

    proxyErrorHandler: (err, res, next) => {
      console.error(`❌ Proxy error for ${serviceName}:`, err.message);

      res.status(503).json({
        error: 'Service Unavailable',
        message: `${serviceName} is currently unavailable`,
        service: serviceName,
      });
    },
  };
}

/**
 * Service token refresh manager
 *
 * Refreshes service tokens periodically to prevent expiration
 */
export class ServiceTokenManager {
  private tokens: Map<ServiceName, string> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(
    private services: ServiceName[],
    private refreshIntervalMs: number = 30 * 60 * 1000 // 30 minutes
  ) {
    this.refreshAllTokens();
    this.startAutoRefresh();
  }

  /**
   * Refresh all service tokens
   */
  private refreshAllTokens(): void {
    console.log('🔄 Refreshing all service tokens...');

    for (const service of this.services) {
      const token = generateServiceToken(service, ['internal']);
      this.tokens.set(service, token);
    }

    console.log(`✅ Refreshed ${this.tokens.size} service tokens`);
  }

  /**
   * Get current token for a service
   */
  getToken(service: ServiceName): string {
    const token = this.tokens.get(service);

    if (!token) {
      // Generate on-demand if not found
      const newToken = generateServiceToken(service, ['internal']);
      this.tokens.set(service, newToken);
      return newToken;
    }

    return token;
  }

  /**
   * Start automatic token refresh
   */
  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshAllTokens();
    }, this.refreshIntervalMs);

    console.log(`🔄 Service token auto-refresh enabled (every ${this.refreshIntervalMs / 1000}s)`);
  }

  /**
   * Stop automatic refresh (for graceful shutdown)
   */
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      console.log('🛑 Service token auto-refresh stopped');
    }
  }
}

/**
 * Create proxy options with token manager
 *
 * Use this for production to enable automatic token refresh
 */
export function createSecureProxyOptionsWithManager(
  tokenManager: ServiceTokenManager,
  serviceName: ServiceName,
  pathResolver: (req: Request) => string
): Options {
  return {
    proxyReqPathResolver: pathResolver,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers = proxyReqOpts.headers || {};

      // Get fresh service token from manager
      const serviceToken = tokenManager.getToken(serviceName);
      proxyReqOpts.headers['x-service-token'] = serviceToken;

      // Sign and add user context if present
      if ((srcReq as any).user) {
        const user: UserContext = (srcReq as any).user;
        const userToken = signUserContext(user);
        proxyReqOpts.headers['x-user-token'] = userToken;

        // Legacy headers
        proxyReqOpts.headers['x-user-id'] = user.id;
        proxyReqOpts.headers['x-user-email'] = user.email;
        proxyReqOpts.headers['x-user-role'] = user.role;
        proxyReqOpts.headers['x-user-organization-id'] = user.organization_id;
      }

      // Request tracking
      if ((srcReq as any).requestId) {
        proxyReqOpts.headers['x-request-id'] = (srcReq as any).requestId;
      }

      // Legacy headers
      proxyReqOpts.headers['service-name'] = serviceName;

      if (srcReq.headers.cookie) {
        proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
      }

      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      const setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        userRes.setHeader('Set-Cookie', setCookie);
      }
      return proxyResData;
    },

    proxyErrorHandler: (err, res, next) => {
      console.error(`❌ Proxy error for ${serviceName}:`, err.message);
      res.status(503).json({
        error: 'Service Unavailable',
        message: `${serviceName} is currently unavailable`,
      });
    },
  };
}
