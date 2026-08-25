import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership, User } from '@shared/entities';
import { MembershipResolverService } from './services/membership-resolver.service';
import { GuestMembershipResolverService } from './services/guest-membership-resolver.service';
import { NotificationClientService } from './services/notification-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, User])],
  providers: [MembershipResolverService, GuestMembershipResolverService, NotificationClientService],
  exports: [MembershipResolverService, GuestMembershipResolverService, NotificationClientService],
})
export class CommonModule {}
