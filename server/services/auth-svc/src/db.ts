import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();
import { SubAction } from "./entity/subaction.model";
import { RoleModuleAccess } from "./entity/rolemoduleaccess.model";
import { Action } from './entity/action.model';
import { Roles } from './entity/roles.model';
import { AuditLogSubscriber } from './audit-logging/audit-log.subscriber';

import {
  Country,
  OrganizationModuleSubscription,
  Theme,
  User,
  UserAddress,
  UserBankAccount,
  ModuleEntity,
  Organization,
  Membership,
  InvitationCode,
} from "@shared/entities";
import { ApiLogs, AuditLogs, AuditTransaction, AuditConfig, AuditLogService, auditService } from "@shared/common";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "erp_user",
  password: process.env.DB_PASSWORD || "erp_password_change_in_production",
  database: process.env.DB_DATABASE || "erp_db",
  // Auto-sync enabled in development to create tables before migrations run
  // Migrations will still run for seeding data
  // synchronize: process.env.NODE_ENV !== 'production',
synchronize: false,
  logging: true,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  entities: [
    User,
    Organization,
    Membership,
    InvitationCode,
    Action,
    SubAction,
    Roles,
    RoleModuleAccess,
    Theme,
    ModuleEntity,
    OrganizationModuleSubscription,
    AuditLogs,
    ApiLogs,
    AuditTransaction,
    Country,
    AuditConfig,
    UserAddress,
    UserBankAccount,
  ],
  // Use compiled .js migrations/subscribers when running from dist/production, otherwise use .ts for dev
  migrations:
    __dirname.includes("dist") || process.env.NODE_ENV === "production"
      ? [__dirname + "/migrations/*.js"]
      : ["src/migrations/*.ts"],
  subscribers:
    __dirname.includes("dist") || process.env.NODE_ENV === "production"
      ? [__dirname + "/subscribers/*.js"]
      : ["src/subscribers/*.ts", AuditLogSubscriber],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
    console.log(
      'Loaded subscribers:',
      AppDataSource.subscribers.map(s => s.constructor.name)
    );

    await auditService.loadAuditConfig(
      AppDataSource
    );
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};