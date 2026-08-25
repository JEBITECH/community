import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ApiError } from '@shared/common';
import { User, Membership } from '@shared/entities';
import { ParticipationsService } from './participations.service';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { GuestMembershipResolverService } from '../common/services/guest-membership-resolver.service';
import { Event } from '../events/entities/event.entity';
import { EventDay } from '../events/entities/event-day.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from './entities/participation.entity';
import { Booking } from './entities/booking.entity';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { createTestDataSource, TEST_ORG_ID, createTestUser, createTestMembership, deleteIfAny } from '../test/integration-test-utils';

jest.setTimeout(30000);

describe('ParticipationsService — capacity race (integration, real Postgres locking)', () => {
  const CAPACITY = 3;
  const CONTENDERS = 8;

  let dataSource: DataSource;
  let service: ParticipationsService;
  let eventId: string;
  let dayId: string;
  let componentId: string;
  const userIds: string[] = [];
  const membershipIds: string[] = [];
  const requestUsers: RequestUser[] = [];
  const requestUserByMembershipId = new Map<string, RequestUser>();

  beforeAll(async () => {
    dataSource = createTestDataSource();
    await dataSource.initialize();

    service = new ParticipationsService(
      dataSource,
      new MembershipResolverService(dataSource.getRepository(Membership)),
      new GuestMembershipResolverService(dataSource.getRepository(User), dataSource.getRepository(Membership)),
      dataSource.getRepository(Event),
      dataSource.getRepository(EventComponent),
      dataSource.getRepository(Participation),
      dataSource.getRepository(Booking),
    );

    const event = await dataSource.getRepository(Event).save(
      dataSource.getRepository(Event).create({
        organization_id: TEST_ORG_ID,
        name: '[TEST] Capacity Race Event',
        event_type: 'meeting',
        start_date: '2027-01-01',
        end_date: '2027-01-01',
        status: 'published',
        created_by_user_id: '00000000-0000-0000-0000-000000000000',
        registration_required: true,
      }),
    );
    eventId = event.id;

    const day = await dataSource.getRepository(EventDay).save(
      dataSource.getRepository(EventDay).create({ event_id: event.id, day_number: 1, date: '2027-01-01', title: 'Day 1' }),
    );
    dayId = day.id;

    const component = await dataSource.getRepository(EventComponent).save(
      dataSource.getRepository(EventComponent).create({
        event_day_id: day.id,
        organization_id: TEST_ORG_ID,
        name: '[TEST] Limited Seats',
        component_type: 'activity',
        registration_enabled: true,
        capacity: CAPACITY,
      }),
    );
    componentId = component.id;

    for (let i = 0; i < CONTENDERS; i++) {
      const user = await createTestUser(dataSource, `cap-race-${i}`);
      const membership = await createTestMembership(dataSource, user.id!);
      userIds.push(user.id!);
      membershipIds.push(membership.id);
      const requestUser: RequestUser = { id: user.id!, email: '', role: 'internal_member', organization_id: TEST_ORG_ID };
      requestUsers.push(requestUser);
      requestUserByMembershipId.set(membership.id, requestUser);
    }
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM booking WHERE participation_id IN (SELECT id FROM participation WHERE event_id = $1)', [eventId]);
    await dataSource.getRepository(Participation).delete({ event_id: eventId });
    await deleteIfAny(dataSource, EventComponent, [componentId]);
    await deleteIfAny(dataSource, EventDay, [dayId]);
    await deleteIfAny(dataSource, Event, [eventId]);
    await deleteIfAny(dataSource, Membership, membershipIds);
    await deleteIfAny(dataSource, User, userIds);
    await dataSource.destroy();
  });

  it(`admits exactly the configured capacity (${CAPACITY}) out of ${CONTENDERS} concurrent joiners, rejecting the rest with CAPACITY_EXCEEDED`, async () => {
    const results = await Promise.allSettled(
      requestUsers.map((user) => service.create(user, { event_id: eventId, event_component_id: componentId, type: 'join' })),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    expect(succeeded.length).toBe(CAPACITY);
    expect(failed.length).toBe(CONTENDERS - CAPACITY);
    for (const r of failed) {
      expect(r.reason).toBeInstanceOf(ApiError);
      expect((r.reason as ApiError).code).toBe('CAPACITY_EXCEEDED');
      expect((r.reason as ApiError).statusCode).toBe(409);
    }

    // The DB's own count must agree — this is the real assertion; the
    // service's return values alone don't prove no phantom row slipped in.
    const activeCount = await dataSource
      .getRepository(Participation)
      .count({ where: { event_component_id: componentId, status: 'active' } });
    expect(activeCount).toBe(CAPACITY);
  });

  it('frees a seat on cancel, letting the next contender in', async () => {
    const active = await dataSource.getRepository(Participation).find({ where: { event_component_id: componentId, status: 'active' } });
    expect(active.length).toBe(CAPACITY);

    const winner = active[0];
    const owner = requestUserByMembershipId.get(winner.membership_id);
    expect(owner).toBeDefined();
    await service.cancel(winner.id, owner!);

    // Which of the 8 contenders actually won the previous test's race is
    // non-deterministic (all fired concurrently) — discover a genuine loser
    // from current DB state rather than assuming a fixed index.
    const winningMembershipIds = new Set(active.map((p) => p.membership_id));
    const loserMembershipId = membershipIds.find((id) => id !== winner.membership_id && !winningMembershipIds.has(id));
    expect(loserMembershipId).toBeDefined();
    const previouslyRejectedUser = requestUserByMembershipId.get(loserMembershipId!)!;

    const participation = await service.create(previouslyRejectedUser, {
      event_id: eventId,
      event_component_id: componentId,
      type: 'join',
    });
    expect(participation.status).toBe('active');

    const activeCount = await dataSource
      .getRepository(Participation)
      .count({ where: { event_component_id: componentId, status: 'active' } });
    expect(activeCount).toBe(CAPACITY);
  });
});
