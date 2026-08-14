import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
import { ApiLogs } from './entity/api-logs.enitity';
import { AuditTransaction } from './entity/audit-transaction.entity';
import { AuditLogs } from './entity/audit-logs.entity';
import { AuditConfig } from './entity/audit-config.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_password_change_in_production',
  database: process.env.DB_DATABASE || 'erp_db',
  // Auto-sync enabled for development (no migrations yet)
  synchronize: process.env.NODE_ENV !== 'production',
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  entities: [
    ApiLogs,
    AuditTransaction,
    AuditLogs,
    AuditConfig
  ],
  // Use compiled .js migrations/subscribers when running from dist/production, otherwise use .ts for dev
  // migrations: __dirname.includes('dist') || process.env.NODE_ENV === 'production'
  //   ? [__dirname + '/migrations/*.js']
  //   : ['src/migrations/*.ts'],
  // subscribers: __dirname.includes('dist') || process.env.NODE_ENV === 'production'
  //   ? [__dirname + '/subscribers/*.js']
  //   : ['src/subscribers/*.ts'],
});

export const initializeCommonDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Common Database connection established successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
