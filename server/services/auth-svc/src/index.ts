import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { useExpressServer } from 'routing-controllers';
import swaggerUi from 'swagger-ui-express';
import * as dotenv from 'dotenv';
dotenv.config();
import { getMetadataArgsStorage } from 'routing-controllers';
import { validationMetadatasToSchemas } from "class-validator-jsonschema";
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { AppDataSource, initializeDatabase } from './db';
import { initializeCommonDatabase } from '@shared/common';
import { AuthController } from './controllers/auth.controllers';
import { UserController } from './controllers/user.controllers';
import { OrganizationController } from './controllers/organization.controller';
import { ModuleController } from './controllers/module.controller';
import { ActionController } from './controllers/action.controller';
import { SubActionController } from './controllers/subaction.controller';
import { RoleController } from './controllers/role.controller';
import { RoleModuleAccessController } from './controllers/rolemoduleaccess.controller';
import { logger, apiLoggingMiddleware, runWithRequestContext } from '@shared/common';

import { ApiError } from '@shared/common/errors/ApiError';
import { errorHandler } from '@shared/common/middlewares/errorHandler'
import { userContextMiddleware } from './middlewares/user-context.middleware';
import { FirebaseUploadController } from './controllers/firebase-upload.controller';
import { UserBankAccountController } from './controllers/user-bank-account.controller';
import { UserAddressController } from './controllers/user-address.controller';

const app = express();
const PORT = process.env.PORT || 4001;

app.use((req, res, next) => {

  const requestId: string = Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : req.headers['x-request-id'];
  const transactionId: string = Array.isArray(req.headers['transaction-id']) ? req.headers['transaction-id'][0] : req.headers['transaction-id'];
  const organizationId: string = Array.isArray(req.headers['x-user-organization-id']) ? req.headers['x-user-organization-id'][0] : req.headers['x-user-organization-id'];
  // const serviceName: string = Array.isArray(req.headers['service-name']) ? req.headers['service-name'][0] : req.headers['service-name'];
  runWithRequestContext({
    requestId,
    transactionId,
    organizationId
  }, () => next());

});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'transaction-id']
}));

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================================
// SECURITY: User Context Verification
// ============================================================================
// Verify signed user context from gateway (prevents header spoofing)
app.use(userContextMiddleware);
console.log('✅ User context verification middleware enabled');
// ============================================================================

// Health check endpoint
app.get('/auth/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});


app.get('/auth/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

useExpressServer(app, {
  controllers: [
    AuthController,
    UserController,
    OrganizationController,
    ModuleController,
    ActionController,
    SubActionController,
    RoleController,
    RoleModuleAccessController,
    FirebaseUploadController,
    UserBankAccountController,
    UserAddressController,
  ],
  defaultErrorHandler: true,
});

const storage = getMetadataArgsStorage();
const schemas = validationMetadatasToSchemas();
const spec = routingControllersToSpec(
  storage,
  {
    controllers: [
      OrganizationController,
      AuthController,
      UserController,
      ModuleController,
      ActionController,
      SubActionController,
      RoleController,
      RoleModuleAccessController,
      FirebaseUploadController,
      UserBankAccountController,
      UserAddressController,
    ],
  },
  {
    components: {
      schemas,
    },
    info: {
      title: "Community Auth Service API",
      version: "1.0.0",
    },
  },
);

app.get('/swagger.json', (_req, res) => {
  res.json(spec);
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(spec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth Service API Documentation'
}));


app.use(apiLoggingMiddleware);

async function bootstrap() {
  try {
    // Initialize database
    await initializeDatabase();
    await initializeCommonDatabase();
    // Start server
    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
      logger.info(`Auth endpoints: http://localhost:${PORT}/auth/*`);
    });

  } catch (error) {
    console.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

bootstrap();
app.get('/test-error', (_req, _res) => {
  throw new ApiError('This is a test error', 400, 'TEST_ERROR', true, '/test-error');
});


app.use(errorHandler);
app.use((req, _res, _next) => {
  if (_res.statusCode > 299) {
    // errorHandler()
    // const error = new ApiError(_res.statusMessage, _res.statusCode, _res.statusMessage, true, req.originalUrl);
    // errorHandler(error, req, _res, _next);
    // throw new ApiError(_res.statusMessage, _res.statusCode, _res.statusMessage, true, req.originalUrl);
  }

  // return _next(new ApiError('Route not found', 404, 'NOT_FOUND', true, req.originalUrl));
});;

// app.use(errorHandler);
