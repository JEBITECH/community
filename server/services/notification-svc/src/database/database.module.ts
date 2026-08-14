import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NOTIFICATION_ENTITIES } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature(NOTIFICATION_ENTITIES)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
