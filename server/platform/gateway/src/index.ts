import express, { Request, Response, NextFunction } from "express";
import * as dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import proxy from "express-http-proxy";
import cookieParser from 'cookie-parser';
import pino from "pino";
import { DataSource } from "typeorm";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
    }
    : undefined,
});
import jwt from "jsonwebtoken";
import JwtAuthGuard from "./guards/jwt-auth.gaurd";

import { requestContextMiddleware } from "./middlewares/RequestContext.middleware";
import { MicroserviceNamesEnum } from "./enums/microservice-names.enum";
import { createCorsOriginResolver } from "./cors-origin-resolver";

dotenv.config();

// ============================================================================
// DATABASE: TypeORM DataSource for CORS origin resolution
// ============================================================================
const erpDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.COMMUNITY_DB_NAME || process.env.ERP_DB_NAME || 'community_db',
  synchronize: false,
  logging: isDev ? ['error'] : false,
});

// ============================================================================
// SECURITY: User Context Signing
// ============================================================================
// Validate USER_CONTEXT_SECRET is set
const USER_CONTEXT_SECRET = process.env.USER_CONTEXT_SECRET;

if (!USER_CONTEXT_SECRET || USER_CONTEXT_SECRET.length < 32) {
  console.error('❌ USER_CONTEXT_SECRET must be set and at least 32 characters');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('USER_CONTEXT_SECRET is required in production');
  }
  console.warn('⚠️  Using default secret for development - CHANGE IN PRODUCTION');
}

/**
 * Sign user context as JWT token
 * Prevents header spoofing and privilege escalation attacks
 */
function signUserContext(user: any): string {
  if (!user) return '';

  try {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
      },
      USER_CONTEXT_SECRET || 'dev-secret-change-in-production',
      {
        expiresIn: '5m',  // Short-lived, only for request duration
        issuer: 'community-gateway',
        audience: 'community-services',
      }
    );
  } catch (error) {
    console.error('Failed to sign user context:', error);
    return '';
  }
}
// ============================================================================

const app = express();

// Middleware
app.use(cookieParser() as any);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(helmet());
app.use(cors({
  origin: createCorsOriginResolver(erpDataSource),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'transaction-id'],
}));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", service: "community-gateway" }));

// Root endpoint
app.get("/api", (_req, res) => res.send("Community Gateway is running. Use /health to check status."));

const jwtGuard = new JwtAuthGuard();

// Apply JWT guard as middleware with proper function binding
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  jwtGuard.use(req, res, next);
});

// Apply middleware globally
app.use(requestContextMiddleware);

// ============================================================================
// Auth service proxy (RBAC/ACL, organization-management, baseline auth)
// ============================================================================
if (process.env.AUTH_SERVICE_URL) {
  app.use("/api/auth/firebase/upload",
    proxy(process.env.AUTH_SERVICE_URL as string, {
      parseReqBody: false,
      proxyReqPathResolver: (req: Request) => '/auth/firebase/upload',
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers = proxyReqOpts.headers || {};
        proxyReqOpts.headers['service-name'] = MicroserviceNamesEnum.AUTH_SERVICE;

        if ((srcReq as any).user) {
          const user = (srcReq as any).user;
          const userToken = signUserContext(user);
          if (userToken) {
            proxyReqOpts.headers['x-user-token'] = userToken;
          }
          proxyReqOpts.headers['x-user-id'] = user.id;
          proxyReqOpts.headers['x-user-email'] = user.email;
          proxyReqOpts.headers['x-user-role'] = user.role;
          if (user.organization_id) {
            proxyReqOpts.headers['x-user-organization-id'] = user.organization_id.toString();
          }
        }
        return proxyReqOpts;
      }
    })
  );
  app.use(
    "/api/auth",
    proxy(process.env.AUTH_SERVICE_URL as string, {
      proxyReqPathResolver: (req: Request) => `/auth${req.url}`,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers = proxyReqOpts.headers || {};
        proxyReqOpts.headers['service-name'] = MicroserviceNamesEnum.AUTH_SERVICE;

        // Forward cookies
        if (srcReq.headers.cookie) {
          proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
        }

        // Sign and forward user context
        if ((srcReq as any).user) {
          const user = (srcReq as any).user;

          const userToken = signUserContext(user);
          if (userToken) {
            proxyReqOpts.headers['x-user-token'] = userToken;
            logger.debug({ userId: user.id, email: user.email }, 'Signed user context for auth service');
          }

          // Keep legacy headers for backward compatibility
          proxyReqOpts.headers['x-user-id'] = user.id;
          proxyReqOpts.headers['x-user-email'] = user.email;
          proxyReqOpts.headers['x-user-role'] = user.role;
          if (user.organization_id) {
            proxyReqOpts.headers['x-user-organization-id'] = user.organization_id.toString();
          }
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
    })
  );
} else {
  console.warn('AUTH_SERVICE_URL not defined, skipping /api/auth proxy');
}

// ============================================================================
// Notification service proxy (preferences, templates, logs — the REST API
// consumed by the frontend notification module). The dispatch/orchestration
// side of notification-svc is reached over TCP by auth-svc directly
// (NOTIFICATION_MICROSERVICE_HOST/PORT) and does not go through this proxy.
// ============================================================================
if (process.env.NOTIFICATION_SERVICE_URL) {
  app.use(
    "/api/notifications",
    proxy(process.env.NOTIFICATION_SERVICE_URL as string, {
      proxyReqPathResolver: (req: Request) => `/api/notifications${req.url}`,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers = proxyReqOpts.headers || {};
        proxyReqOpts.headers['service-name'] = MicroserviceNamesEnum.NOTIFICATION_SERVICE;

        if ((srcReq as any).user) {
          const user = (srcReq as any).user;
          const userToken = signUserContext(user);
          if (userToken) {
            proxyReqOpts.headers['x-user-token'] = userToken;
          }
          proxyReqOpts.headers['x-user-id'] = user.id;
          proxyReqOpts.headers['x-user-email'] = user.email;
          proxyReqOpts.headers['x-user-role'] = user.role;
          if (user.organization_id) {
            proxyReqOpts.headers['x-user-organization-id'] = user.organization_id.toString();
          }
        }
        return proxyReqOpts;
      },
    })
  );
} else {
  console.warn('NOTIFICATION_SERVICE_URL not defined, skipping /api/notifications proxy');
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
});

// Debug environment variables
console.log('Environment Variables:');
console.log('AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);

// Start server
const PORT = process.env.PORT || process.env.COMMUNITY_GATEWAY_PORT || process.env.GATEWAY_PORT || 4000;

async function bootstrap() {
  try {
    await erpDataSource.initialize();
    logger.info('Community DataSource initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Community DataSource — CORS dynamic origin resolution will not work');
    // Do not throw — allow gateway to start; CORS resolver will fail gracefully
  }

  app.listen(PORT, () => {
    logger.info(`Community Gateway running on port ${PORT}`);
  });
}

bootstrap();
