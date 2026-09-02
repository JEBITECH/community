import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ApiError } from '@shared/common';
import { User, Membership } from '@shared/entities';
import { VolunteersService } from './volunteers.service';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { NotificationClientService } from '../common/services/notification-client.service';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from '../participations/entities/participation.entity';
import { VolunteerRole } from './entities/volunteer-role.entity';
import { VolunteerAssignment } from './entities/volunteer-assignment.entity';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { createTestDataSource, TEST_ORG_ID, createTestUser, createTestMembership, deleteIfAny } from '../test/integration-test-utils';

jest.setTimeout(30000);

describe('VolunteersService — slot race (integration, real Postgres locking)', () => {
  const HEADCOUNT_NEEDED = 2;
  const CONTENDERS = 6;

  let dataSource: DataSource;
  let notificationClient: NotificationClientService;
  let service: VolunteersService;
  let eventId: string;
  let roleId: string;
  const userIds: string[] = [];
  const membershipIds: string[] = [];
  const requestUsers: RequestUser[] = [];

  beforeAll(async () => {
    dataSource = createTestDataSource();
    await dataSource.initialize();
    notificationClient = new NotificationClientService();

    service = new VolunteersService(
      dataSource,
      new MembershipResolverService(dataSource.getRepository(Membership)),
      notificationClient,
      dataSource.getRepository(Event),
      dataSource.getRepository(EventComponent),
      dataSource.getRepository(Participation),
      dataSource.getRepository(VolunteerRole),
      dataSource.getRepository(VolunteerAssignment),
      dataSource.getRepository(Membership),
    );

    const event = await dataSource.getRepository(Event).save(
      dataSource.getRepository(Event).create({
        organization_id: TEST_ORG_ID,
        name: '[TEST] Slot Race Event',
        event_type: 'meeting',
        start_date: '2027-01-01',
        end_date: '2027-01-01',
        status: 'published',
        created_by_user_id: '00000000-0000-0000-0000-000000000000',
      }),
    );
    eventId = event.id;

    const role = await dataSource.getRepository(VolunteerRole).save(
      dataSource.getRepository(VolunteerRole).create({
        organization_id: TEST_ORG_ID,
        event_id: event.id,
        title: '[TEST] Gate Duty',
        headcount_needed: HEADCOUNT_NEEDED,
        headcount_filled: 0,
        status: 'open',
      }),
    );
    roleId = role.id;

    for (let i = 0; i < CONTENDERS; i++) {
      const user = await createTestUser(dataSource, `slot-race-${i}`);
      const membership = await createTestMembership(dataSource, user.id!);
      userIds.push(user.id!);
      membershipIds.push(membership.id);
      requestUsers.push({ id: user.id!, email: '', role: 'internal_member', organization_id: TEST_ORG_ID });
    }
  });

  afterAll(async () => {
    await dataSource.getRepository(VolunteerAssignment).delete({ volunteer_role_id: roleId });
    await dataSource.getRepository(Participation).delete({ event_id: eventId });
    await deleteIfAny(dataSource, VolunteerRole, [roleId]);
    await deleteIfAny(dataSource, Event, [eventId]);
    await deleteIfAny(dataSource, Membership, membershipIds);
    await deleteIfAny(dataSource, User, userIds);
    await dataSource.destroy();
    notificationClient.onModuleDestroy();
  });

  it(`fills exactly ${HEADCOUNT_NEEDED} of ${CONTENDERS} concurrent sign-ups and rejects the rest with SLOT_FULL`, async () => {
    const results = await Promise.allSettled(requestUsers.map((user) => service.create(user, { volunteer_role_id: roleId })));

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    expect(succeeded.length).toBe(HEADCOUNT_NEEDED);
    expect(failed.length).toBe(CONTENDERS - HEADCOUNT_NEEDED);
    for (const r of failed) {
      expect(r.reason).toBeInstanceOf(ApiError);
      expect((r.reason as ApiError).code).toBe('SLOT_FULL');
    }

    const role = await dataSource.getRepository(VolunteerRole).findOneOrFail({ where: { id: roleId } });
    expect(role.headcount_filled).toBe(HEADCOUNT_NEEDED);
    expect(role.status).toBe('filled');

    const assignmentCount = await dataSource.getRepository(VolunteerAssignment).count({ where: { volunteer_role_id: roleId } });
    expect(assignmentCount).toBe(HEADCOUNT_NEEDED);
  });

  it('allows a member to sign up again after withdrawing from the same role', async () => {
    const roleRepo = dataSource.getRepository(VolunteerRole);
    const testRole = await roleRepo.save(
      roleRepo.create({
        organization_id: TEST_ORG_ID,
        event_id: eventId,
        title: '[TEST] Re-signup Role',
        headcount_needed: 2,
        headcount_filled: 0,
        status: 'open',
      }),
    );

    try {
      const user = requestUsers[0];
      const first = await service.create(user, { volunteer_role_id: testRole.id });
      expect(first.approval_status).toBe('pending');

      await service.cancel(first.id, user);

      const second = await service.create(user, { volunteer_role_id: testRole.id });
      expect(second.id).not.toBe(first.id);
      expect(second.approval_status).toBe('pending');

      const assignments = await dataSource.getRepository(VolunteerAssignment).find({
        where: { volunteer_role_id: testRole.id, membership_id: membershipIds[0] },
        order: { createdAt: 'ASC' },
      });
      expect(assignments).toHaveLength(2);
      expect(assignments[0].approval_status).toBe('withdrawn');
      expect(assignments[1].approval_status).toBe('pending');
    } finally {
      await dataSource.getRepository(VolunteerAssignment).delete({ volunteer_role_id: testRole.id });
      await dataSource.getRepository(Participation).delete({ event_id: eventId, membership_id: membershipIds[0], type: 'volunteer' });
      await roleRepo.delete({ id: testRole.id });
    }
  });

  it('allows the same member to sign up for two different roles on the same event', async () => {
    const roleRepo = dataSource.getRepository(VolunteerRole);
    const [firstRole, secondRole] = await Promise.all([
      roleRepo.save(
        roleRepo.create({
          organization_id: TEST_ORG_ID,
          event_id: eventId,
          title: '[TEST] Same Event Role A',
          headcount_needed: 2,
          headcount_filled: 0,
          status: 'open',
        }),
      ),
      roleRepo.save(
        roleRepo.create({
          organization_id: TEST_ORG_ID,
          event_id: eventId,
          title: '[TEST] Same Event Role B',
          headcount_needed: 2,
          headcount_filled: 0,
          status: 'open',
        }),
      ),
    ]);

    try {
      const user = requestUsers[1];
      const first = await service.create(user, { volunteer_role_id: firstRole.id });
      const second = await service.create(user, { volunteer_role_id: secondRole.id });

      expect(first.volunteer_role_id).toBe(firstRole.id);
      expect(second.volunteer_role_id).toBe(secondRole.id);
    } finally {
      await dataSource.getRepository(VolunteerAssignment).delete({ volunteer_role_id: firstRole.id });
      await dataSource.getRepository(VolunteerAssignment).delete({ volunteer_role_id: secondRole.id });
      await dataSource.getRepository(Participation).delete({ event_id: eventId, membership_id: membershipIds[1], type: 'volunteer' });
      await roleRepo.delete([firstRole.id, secondRole.id]);
    }
  });

  it('rejecting an assignment releases the slot and re-opens the role', async () => {
    const assignments = await dataSource.getRepository(VolunteerAssignment).find({ where: { volunteer_role_id: roleId } });
    expect(assignments.length).toBe(HEADCOUNT_NEEDED);

    const admin: RequestUser = { id: '00000000-0000-0000-0000-000000000000', email: '', role: 'super_admin', organization_id: TEST_ORG_ID };
    await service.reject(assignments[0].id, admin);

    const role = await dataSource.getRepository(VolunteerRole).findOneOrFail({ where: { id: roleId } });
    expect(role.headcount_filled).toBe(HEADCOUNT_NEEDED - 1);
    expect(role.status).toBe('open');

    // A previously-rejected (SLOT_FULL) contender can now get in.
    const previouslyRejectedUser = requestUsers[HEADCOUNT_NEEDED];
    const assignment = await service.create(previouslyRejectedUser, { volunteer_role_id: roleId });
    expect(assignment.approval_status).toBe('pending');

    const roleAfter = await dataSource.getRepository(VolunteerRole).findOneOrFail({ where: { id: roleId } });
    expect(roleAfter.headcount_filled).toBe(HEADCOUNT_NEEDED);
  });
});
