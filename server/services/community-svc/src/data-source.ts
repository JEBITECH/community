import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { User, Organization, Membership, InvitationCode, ModuleEntity, Theme, OrganizationModuleSubscription, UserAddress, UserBankAccount, Country } from '@shared/entities';
import { ApiLogs, AuditLogs, AuditTransaction, AuditConfig } from '@shared/common';
import { Event } from './events/entities/event.entity';
import { EventDay } from './events/entities/event-day.entity';
import { EventComponent } from './events/entities/event-component.entity';
import { EventOrganizer } from './events/entities/event-organizer.entity';
import { Participation } from './participations/entities/participation.entity';
import { Booking } from './participations/entities/booking.entity';
import { BookingAttendee } from './participations/entities/booking-attendee.entity';
import { Donation } from './donations/entities/donation.entity';
import { SponsorshipNeed } from './donations/entities/sponsorship-need.entity';
import { Sponsorship } from './donations/entities/sponsorship.entity';
import { VolunteerRole } from './volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from './volunteers/entities/volunteer-assignment.entity';
import { EventComment } from './comments/entities/event-comment.entity';
import { EventChatMessage } from './chat/entities/event-chat-message.entity';
import { ChatConfig } from './chat/entities/chat-config.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_password_change_in_production',
  database: process.env.DB_DATABASE || 'community_db',
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
    Booking,
    BookingAttendee,
    Donation,
    SponsorshipNeed,
    Sponsorship,
    VolunteerRole,
    VolunteerAssignment,
    EventComment,
    EventChatMessage,
    ChatConfig,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'community_migrations',
});
