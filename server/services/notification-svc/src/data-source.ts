import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';

const SHARED_ENTITY_GLOB =
  __dirname + '/../../../../server/platform/shared-entities/src/*{.ts,.js}';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_password_change_in_production',
  database: process.env.DB_DATABASE || process.env.ERP_DB_NAME || 'erp_db',
  entities: [SHARED_ENTITY_GLOB],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'notification_migrations',
});
