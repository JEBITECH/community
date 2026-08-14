import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { NotificationModule } from './notification/notification.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { PreferenceModule } from './preference/preference.module';
import { TemplateModule } from './template/template.module';
import { NotificationTcpController } from './tcp/notification-tcp.controller';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NotificationManagementModule } from './notification-management/notification-management.module';

const SHARED_ENTITY_GLOB =
  __dirname + '/../../../../server/platform/shared-entities/src/*{.ts,.js}';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'erp_user',
      password: process.env.DB_PASSWORD || 'erp_password_change_in_production',
      database: process.env.DB_DATABASE || process.env.ERP_DB_NAME || 'erp_db',
      // synchronize: process.env.NODE_ENV !== 'production',
      synchronize: false,
      entities: [SHARED_ENTITY_GLOB],
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      migrationsTableName: 'notification_migrations',
      logging: process.env.NODE_ENV !== 'production',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    NotificationModule,
    BootstrapModule,
    PreferenceModule,
    TemplateModule,
    SchedulerModule,
    NotificationManagementModule,
  ],
  controllers: [AppController, NotificationTcpController],
})
export class AppModule {}
