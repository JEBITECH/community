import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { ParticipationsModule } from './participations/participations.module';
import { DonationsModule } from './donations/donations.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { CommentsModule } from './comments/comments.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ChatModule } from './chat/chat.module';
import { MembersModule } from './members/members.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { UserContextMiddleware } from './common/middleware/user-context.middleware';
import { User, Organization, Membership, InvitationCode, ModuleEntity, Theme, OrganizationModuleSubscription, UserAddress, UserBankAccount, Country } from '@shared/entities';
import { ApiLogs, AuditLogs, AuditTransaction, AuditConfig } from '@shared/common';
import { Event } from './events/entities/event.entity';
import { EventDay } from './events/entities/event-day.entity';
import { EventComponent } from './events/entities/event-component.entity';
import { EventOrganizer } from './events/entities/event-organizer.entity';
import { Participation } from './participations/entities/participation.entity';
import { ParticipationBeneficiary } from './participations/entities/participation-beneficiary.entity';
import { Booking } from './participations/entities/booking.entity';
import { Donation } from './donations/entities/donation.entity';
import { SponsorshipNeed } from './donations/entities/sponsorship-need.entity';
import { Sponsorship } from './donations/entities/sponsorship.entity';
import { VolunteerRole } from './volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from './volunteers/entities/volunteer-assignment.entity';
import { EventComment } from './comments/entities/event-comment.entity';
import { EventDiscussionTopic } from './discussions/entities/event-discussion-topic.entity';
import { Announcement } from './announcements/entities/announcement.entity';
import { EventChatMessage } from './chat/entities/event-chat-message.entity';
import { ChatConfig } from './chat/entities/chat-config.entity';
import { CommunityAuditLogSubscriber } from './audit-logging/audit-log.subscriber';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'erp_user',
      password: process.env.DB_PASSWORD || 'erp_password_change_in_production',
      database: process.env.DB_DATABASE || 'community_db',
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
      entities: [
        User,
        Organization,
        Membership,
        InvitationCode,
        ModuleEntity,
        Theme,
        OrganizationModuleSubscription,
        UserAddress,
        UserBankAccount,
        Country,
        AuditLogs,
        ApiLogs,
        AuditTransaction,
        AuditConfig,
        Event,
        EventDay,
        EventComponent,
        EventOrganizer,
        Participation,
        ParticipationBeneficiary,
        Booking,
        Donation,
        SponsorshipNeed,
        Sponsorship,
        VolunteerRole,
        VolunteerAssignment,
        EventComment,
        EventDiscussionTopic,
        Announcement,
        EventChatMessage,
        ChatConfig,
      ],
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      migrationsTableName: 'community_migrations',
      subscribers: [CommunityAuditLogSubscriber],
    }),
    EventsModule,
    ParticipationsModule,
    DonationsModule,
    VolunteersModule,
    CommentsModule,
    DiscussionsModule,
    AnnouncementsModule,
    ChatModule,
    MembersModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserContextMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL }, { path: 'public/(.*)', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
