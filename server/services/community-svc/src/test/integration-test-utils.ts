import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import {
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
} from '@shared/entities';
import { ApiLogs, AuditLogs, AuditTransaction, AuditConfig } from '@shared/common';
import { Event } from '../events/entities/event.entity';
import { EventDay } from '../events/entities/event-day.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { EventOrganizer } from '../events/entities/event-organizer.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Booking } from '../participations/entities/booking.entity';
import { BookingAttendee } from '../participations/entities/booking-attendee.entity';
import { Donation } from '../donations/entities/donation.entity';
import { SponsorshipNeed } from '../donations/entities/sponsorship-need.entity';
import { Sponsorship } from '../donations/entities/sponsorship.entity';
import { VolunteerRole } from '../volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from '../volunteers/entities/volunteer-assignment.entity';
import { EventComment } from '../comments/entities/event-comment.entity';
import { EventChatMessage } from '../chat/entities/event-chat-message.entity';
import { ChatConfig } from '../chat/entities/chat-config.entity';

/**
 * Integration tests in this service exercise real Postgres row-locking
 * (`SELECT ... FOR UPDATE` inside `dataSource.transaction()`), which SQLite
 * or a mocked repository can't reproduce faithfully — so these tests run
 * against the actual dev database, using disposable `[TEST]`-prefixed
 * fixture rows that each spec file creates in `beforeAll` and deletes in
 * `afterAll`. Mirrors data-source.ts's entity list.
 */
export function createTestDataSource(): DataSource {
  return new DataSource({
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
  });
}

/** Green Acres Society — seeded in every dev environment this app has run
 * against so far. If this ever isn't true, tests will fail loudly on the
 * FK constraint rather than silently writing into the wrong tenant. */
export const TEST_ORG_ID = 2;

let userCounter = 0;

export async function createTestUser(dataSource: DataSource, label: string) {
  userCounter += 1;
  const userRepo = dataSource.getRepository(User);
  const phone = `9${Date.now().toString().slice(-8)}${String(userCounter % 10)}`.slice(0, 10);
  return userRepo.save(
    userRepo.create({
      firstName: `[TEST]`,
      lastName: label,
      phone,
      isActive: true,
      external_user: false,
    }),
  );
}

export async function createTestMembership(dataSource: DataSource, userId: string, role: 'internal_member' | 'super_admin' = 'internal_member') {
  const membershipRepo = dataSource.getRepository(Membership);
  return membershipRepo.save(
    membershipRepo.create({
      user_id: userId,
      organization_id: TEST_ORG_ID,
      role,
      member_type: 'internal',
      status: 'active',
      is_default: false,
    }),
  );
}

export async function deleteIfAny<T extends { id?: string }>(dataSource: DataSource, entity: new () => T, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await dataSource.getRepository(entity).delete(ids);
}
