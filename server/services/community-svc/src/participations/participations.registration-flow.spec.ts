import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Membership } from '@shared/entities';
import { ParticipationsService } from './participations.service';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { GuestMembershipResolverService } from '../common/services/guest-membership-resolver.service';
import { Event } from '../events/entities/event.entity';
import { EventDay } from '../events/entities/event-day.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from './entities/participation.entity';
import { ParticipationBeneficiary } from './entities/participation-beneficiary.entity';
import { Booking } from './entities/booking.entity';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { createTestDataSource, TEST_ORG_ID, createTestUser, createTestMembership, deleteIfAny } from '../test/integration-test-utils';

jest.setTimeout(30000);

describe('ParticipationsService — Join vs Participate registration flow', () => {
  let dataSource: DataSource;
  let service: ParticipationsService;
  let eventId: string;
  let dayId: string;
  let joinFirstComponentId: string;
  let participateFirstComponentId: string;
  let participationOnlyComponentId: string;
  const userIds: string[] = [];
  const membershipIds: string[] = [];

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
      dataSource.getRepository(ParticipationBeneficiary),
      dataSource.getRepository(Booking),
      dataSource.getRepository(Membership),
      dataSource.getRepository(User),
    );

    const event = await dataSource.getRepository(Event).save(
      dataSource.getRepository(Event).create({
        organization_id: TEST_ORG_ID,
        name: '[TEST] Join Participate Flow',
        event_type: 'meeting',
        start_date: '2027-02-01',
        end_date: '2027-02-01',
        status: 'published',
        created_by_user_id: '00000000-0000-0000-0000-000000000000',
        registration_required: true,
      }),
    );
    eventId = event.id;

    const day = await dataSource.getRepository(EventDay).save(
      dataSource.getRepository(EventDay).create({ event_id: event.id, day_number: 1, date: '2027-02-01', title: 'Day 1' }),
    );
    dayId = day.id;

    const componentRepo = dataSource.getRepository(EventComponent);
    const joinFirst = await componentRepo.save(componentRepo.create({
      event_day_id: day.id,
      organization_id: TEST_ORG_ID,
      name: '[TEST] Join First',
      component_type: 'activity',
      registration_enabled: true,
      participation_enabled: true,
      capacity: 10,
    }));
    joinFirstComponentId = joinFirst.id;

    const participateFirst = await componentRepo.save(componentRepo.create({
      event_day_id: day.id,
      organization_id: TEST_ORG_ID,
      name: '[TEST] Participate First',
      component_type: 'activity',
      registration_enabled: true,
      participation_enabled: true,
      capacity: 10,
    }));
    participateFirstComponentId = participateFirst.id;

    const participationOnly = await componentRepo.save(componentRepo.create({
      event_day_id: day.id,
      organization_id: TEST_ORG_ID,
      name: '[TEST] Participate Only',
      component_type: 'activity',
      registration_enabled: false,
      participation_enabled: true,
      capacity: 10,
    }));
    participationOnlyComponentId = participationOnly.id;
  });

  async function makeUser(label: string) {
    const user = await createTestUser(dataSource, label);
    const membership = await createTestMembership(dataSource, user.id!);
    userIds.push(user.id!);
    membershipIds.push(membership.id);
    const requestUser: RequestUser = { id: user.id!, email: '', role: 'internal_member', organization_id: TEST_ORG_ID };
    return { user, membership, requestUser };
  }

  afterAll(async () => {
    if (eventId) {
      await dataSource.query('DELETE FROM booking WHERE participation_id IN (SELECT id FROM participation WHERE event_id = $1)', [eventId]);
      await dataSource.getRepository(Participation).delete({ event_id: eventId });
    }
    await deleteIfAny(dataSource, EventComponent, [joinFirstComponentId, participateFirstComponentId, participationOnlyComponentId].filter(Boolean));
    await deleteIfAny(dataSource, EventDay, [dayId].filter(Boolean));
    await deleteIfAny(dataSource, Event, [eventId].filter(Boolean));
    await deleteIfAny(dataSource, Membership, membershipIds);
    await deleteIfAny(dataSource, User, userIds);
    await dataSource.destroy();
  });

  it('prevents Participate after Quick Join on the same activity', async () => {
    const { requestUser } = await makeUser('join-first');
    const joined = await service.create(requestUser, {
      event_id: eventId,
      event_component_id: joinFirstComponentId,
      type: 'join',
      registration_method: 'join',
    });
    expect(joined.registration_method).toBe('join');

    await expect(service.create(requestUser, {
      event_id: eventId,
      event_component_id: joinFirstComponentId,
      type: 'join',
      registration_method: 'participate',
      mode: 'single',
      beneficiaries: [{ relation_type: 'self' }],
    })).rejects.toMatchObject({ code: 'ALREADY_REGISTERED', statusCode: 409 });
  });

  it('prevents Quick Join after detailed Participate on the same activity', async () => {
    const { requestUser } = await makeUser('participate-first');
    const participated = await service.create(requestUser, {
      event_id: eventId,
      event_component_id: participateFirstComponentId,
      type: 'join',
      registration_method: 'participate',
      mode: 'single',
      beneficiaries: [{ relation_type: 'self' }],
    });
    expect(participated.registration_method).toBe('participate');
    expect(participated.party_size).toBe(1);

    await expect(service.create(requestUser, {
      event_id: eventId,
      event_component_id: participateFirstComponentId,
      type: 'join',
      registration_method: 'join',
    })).rejects.toMatchObject({ code: 'ALREADY_REGISTERED', statusCode: 409 });
  });

  it('rejects Join when the activity is Participate-only', async () => {
    const { requestUser } = await makeUser('participate-only');
    await expect(service.create(requestUser, {
      event_id: eventId,
      event_component_id: participationOnlyComponentId,
      type: 'join',
      registration_method: 'join',
    })).rejects.toMatchObject({ code: 'JOIN_DISABLED', statusCode: 409 });
  });

  it('resolves Self automatically, resolves family membership IDs, and edits the participant list safely', async () => {
    const owner = await makeUser('edit-owner');
    const family = await makeUser('edit-family');

    const created = await service.create(owner.requestUser, {
      event_id: eventId,
      event_component_id: participateFirstComponentId,
      type: 'join',
      registration_method: 'participate',
      mode: 'single',
      beneficiaries: [{ relation_type: 'self', full_name: 'forged name' }],
    });
    const createdRows = await dataSource.getRepository(ParticipationBeneficiary).find({ where: { participation_id: created.id } });
    expect(createdRows).toHaveLength(1);
    expect(createdRows[0].full_name).not.toBe('forged name');
    expect(createdRows[0].membership_id).toBe(owner.membership.id);

    const updated = await service.update(created.id, owner.requestUser, {
      mode: 'multiple',
      beneficiaries: [
        { relation_type: 'self' },
        { relation_type: 'family', membership_id: family.membership.id },
      ],
    });
    expect(updated.mode).toBe('multiple');
    expect(updated.party_size).toBe(2);

    const updatedRows = await dataSource.getRepository(ParticipationBeneficiary).find({ where: { participation_id: created.id } });
    expect(updatedRows).toHaveLength(2);
    expect(updatedRows.find((row) => row.relation_type === 'self')?.membership_id).toBe(owner.membership.id);
    expect(updatedRows.find((row) => row.relation_type === 'family')?.membership_id).toBe(family.membership.id);
  });

  it('allows re-registration after cancelling a previous Join', async () => {
    const { requestUser } = await makeUser('rejoin-after-cancel');

    const first = await service.create(requestUser, {
      event_id: eventId,
      event_component_id: joinFirstComponentId,
      type: 'join',
      registration_method: 'join',
    });

    const cancelled = await service.cancel(first.id, requestUser);
    expect(cancelled.status).toBe('cancelled');

    const second = await service.create(requestUser, {
      event_id: eventId,
      event_component_id: joinFirstComponentId,
      type: 'join',
      registration_method: 'join',
    });

    expect(second.id).not.toBe(first.id);
    expect(second.status).toBe('active');
    expect(second.registration_method).toBe('join');
  });

  it('rejects explicit Quick Join requests that try to attach participant details', async () => {
    const { requestUser } = await makeUser('invalid-join-details');
    await expect(service.create(requestUser, {
      event_id: eventId,
      event_component_id: joinFirstComponentId,
      type: 'join',
      registration_method: 'join',
      beneficiaries: [{ relation_type: 'self' }],
    })).rejects.toMatchObject({ code: 'BENEFICIARIES_NOT_ALLOWED_FOR_JOIN', statusCode: 400 });
  });
});
