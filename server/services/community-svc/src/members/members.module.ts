import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Membership, User])],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
