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
  // Define routes that don't require authentication
  private readonly publicRoutes = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/auth/confirm-password-reset',
    '/api/auth/user/reset-password',
    '/health',
    '/api-docs',
    '/api-docs/*',
    '/api/api-docs',
    '/api/api-docs/*',
    '/swagger.json',
    '/api/swagger.json',
    '/api/auth/user/user-by-token',
    '/api/auth/user/edit-user',
    // Bookings Studio public routes
    '/api/bookings-studio/settings',
    '/api/bookings-studio/settings/*',
    '/api/bookings-studio/themes',
    '/api/bookings-studio/themes/*',
    '/api/bookings-studio/templates',
    '/api/bookings-studio/templates/*',
    '/api/bookings-studio/menus',
    '/api/bookings-studio/menus/*',
    '/api/bookings-studio/forms',
    '/api/bookings-studio/forms/*',
    '/api/bookings-studio/pages',
    '/api/bookings-studio/pages/*',
    '/api/bookings-studio/properties',
    '/api/bookings-studio/properties/*',
    '/api/bookings-studio/blog',
    '/api/bookings-studio/blog/*',
    '/api/bookings-studio/blogs',
    '/api/bookings-studio/blogs/*',
    '/api/bookings-studio/media',
    '/api/bookings-studio/media/*',
    '/api/bookings-studio/reviews',
    '/api/bookings-studio/reviews/*',
    '/api/bookings-studio/promotions',
    '/api/bookings-studio/promotions/*',
    '/api/bookings-studio/inquiries',
    '/api/bookings-studio/inquiries/*',
    '/api/bookings-studio/theme-presets',
    '/api/bookings-studio/theme-presets/*',
    '/api/bookings-studio/template-categories',
    '/api/bookings-studio/template-categories/*',
    '/api/bookings-studio/template-presets',
    '/api/bookings-studio/template-presets/*',
    '/api/bookings-studio/menu-locations',
    '/api/bookings-studio/menu-locations/*',
    '/api/bookings-studio/menu-templates',
    '/api/bookings-studio/menu-templates/*',
    '/api/bookings-studio/menu-items',
    '/api/bookings-studio/menu-items/*',
    '/api/bookings-studio/setup',
    '/api/bookings-studio/setup/*',
    '/api/bookings-studio/sites',
    '/api/bookings-studio/sites/*',
    '/api/bookings-studio/email-templates',
    '/api/bookings-studio/email-templates/*',
    '/api/bookings-studio/translations',
    '/api/bookings-studio/translations/*',
    '/api/bookings-studio/availability',
    '/api/bookings-studio/availability/*',
    '/api/bookings-studio/extras',
    '/api/bookings-studio/extras/*',
    '/api/bookings-studio/reservations',
    '/api/bookings-studio/reservations/*',
    // Guest page - uses its own guest JWT, not a user JWT
    '/api/digital-handbook/guest-page',
    '/api/digital-handbook/guest-page/*',
    // Guest digital-handbook needs to resolve Firebase image URLs (property/unit
    // photos, product photos) without a user JWT. Endpoint is read-only and only
    // returns a signed URL for a given filePath, so safe to expose.
    '/api/data-import/firebase/download-url',
    '/api/virtual-inspect/health',
    '/api/bookings/health',
    // Booking engine guest auth (public — it handles its own auth)
    '/api/bookings/guest-auth',
    '/api/bookings/guest-auth/*',
    '/api/bookings/guests',
    '/api/bookings/guests/*',
    // Booking engine public routes (authenticated via public-access-token cookie)
    '/api/bookings/availability',
    '/api/bookings/availability/*',
    '/api/bookings/location',
    '/api/bookings/location/*',
    '/api/bookings/unit-types',
    '/api/bookings/unit-types/*',
    '/api/bookings/maps',
    '/api/bookings/maps/*',
    '/api/bookings/unit',
    '/api/bookings/unit/*',
    '/api/bookings/price-calculation',
    '/api/bookings/price-calculation/*',
    '/api/bookings/availability',
    '/api/bookings/availability/*',
    '/api/bookings-studio/health',
    '/api/data-import/webhook/*',
    '/api/digital-handbook/sessions/init',
    '/api/digital-handbook/sessions/guest/*',
  ];

  constructor() { }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const originalUrl = req.originalUrl;
    const method = req.method;

    console.log(`🚨 JWT GUARD - ${method} ${originalUrl}`);
    console.log(`📋 Public routes:`, this.publicRoutes);

    // Check if it's a public route first
    if (this.isPublicRoute(originalUrl)) {
      console.log(`✅ PUBLIC ROUTE - Bypassing JWT for: ${originalUrl}`);
      return next();
    }

    // Check if it's an auth route that should be public
    if (this.isAuthPublicRoute(originalUrl)) {
      console.log(`✅ AUTH PUBLIC ROUTE - Bypassing JWT for: ${originalUrl}`);
      return next();
    }

    console.log(`🔒 PROTECTED ROUTE - Requiring JWT for: ${originalUrl}`);

    const token = this.extractTokenFromHeader(req);
    console.log(`🔑 Token present: ${!!token}`);

    if (!token) {
      // For booking engine routes, accept public-access-token cookie as auth
      if ((originalUrl.startsWith('/api/booking') || originalUrl.startsWith('/api/bookings')) && !originalUrl.startsWith('/api/bookings/admin')) {
        const publicAccessToken = this.extractPublicAccessTokenFromCookie(req);
        if (publicAccessToken) {
          console.log(`✅ PUBLIC ACCESS TOKEN found in cookie for booking route: ${originalUrl}`);
          return next();
        }
      }

      console.log(`❌ No token found for protected route: ${originalUrl}`);
      res.status(401).json({ message: 'Unauthorized, token is not provided' });
      return;
    }

    try {
      if ((originalUrl.startsWith('/api/booking') || originalUrl.startsWith('/api/bookings')) && (!originalUrl.startsWith('/api/bookings/admin'))) {
        return next();
      }
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
      console.log(' user Dataaa: ', JSON.stringify(req.user));
      console.log(`✅ JWT verified for user: ${payload.email}- ${payload.role} }`);
      next();
    } catch (error: any) {
      console.log(`❌ JWT verification failed: ${error.message}`);
      res.status(401).json({ message: 'Unauthorized, token is expired or invalid' });
    }
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractTokenFromHeader(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    console.log(`🔍 Authorization header: ${authHeader}`);

    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Extract public-access-token from cookies
   */
  private extractPublicAccessTokenFromCookie(req: Request): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    const match = cookieHeader.match(/(?:^|;\s*)public-access-token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  /**
   * Check if it's a public auth route (login, refresh, register)
   */
  private isAuthPublicRoute(url: string): boolean {
    const authPublicRoutes = [
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/register',
      '/api/bookings/auth/generate-public-access-token',
      '/api/bookings/auth/validate-public-access-token',
      '/api/bookings/guest-auth/register',
      '/api/bookings/guest-auth/login',
      '/api/bookings/guest-auth/send-otp',
      '/api/bookings/guest-auth/verify-otp',
      '/api/bookings/guest-auth/forgot-password',
      '/api/bookings/guest-auth/reset-password',
    ];
    const isAuthPublic = authPublicRoutes.some(route => url === route);
    console.log(`🔍 Is auth public route: ${isAuthPublic}`);
    return isAuthPublic;
  }

  /**
   * Check if the current route is a public route
   */
  private isPublicRoute(url: string): boolean {
    // Strip query string for matching
    const urlPath = url.split('?')[0];

    const isPublic = this.publicRoutes.some(publicRoute => {
      // Wildcard route (e.g. /api-docs/*)
      if (publicRoute.endsWith('*')) {
        const base = publicRoute.slice(0, -1);
        return urlPath.startsWith(base);
      }

      // Exact match (ignoring query params)
      return urlPath === publicRoute;
    });

    console.log(`🔍 Is public route: ${isPublic}`);
    return isPublic;
  }
}

export default JwtAuthGuard;