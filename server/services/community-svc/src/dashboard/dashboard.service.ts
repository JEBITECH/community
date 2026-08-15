import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership, Organization } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Sponsorship } from '../donations/entities/sponsorship.entity';
import { VolunteerRole } from '../volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from '../volunteers/entities/volunteer-assignment.entity';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Organization) private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(Participation) private readonly participationRepo: Repository<Participation>,
    @InjectRepository(Donation) private readonly donationRepo: Repository<Donation>,
    @InjectRepository(Sponsorship) private readonly sponsorshipRepo: Repository<Sponsorship>,
    @InjectRepository(VolunteerRole) private readonly volunteerRoleRepo: Repository<VolunteerRole>,
    @InjectRepository(VolunteerAssignment) private readonly volunteerAssignmentRepo: Repository<VolunteerAssignment>,
  ) {}

  private assertOrgScoped(user: RequestUser): number {
    if (user.organization_id == null) {
      throw new ApiError('An active organization membership is required', 403, 'NO_ACTIVE_ORG');
    }
    return user.organization_id;
  }

  async orgSummary(user: RequestUser) {
    const organizationId = this.assertOrgScoped(user);
    const today = new Date().toISOString().slice(0, 10);

    const [membersActive, membersPending, membersInternal, membersExternal] = await Promise.all([
      this.membershipRepo.count({ where: { organization_id: organizationId, status: 'active' } }),
      this.membershipRepo.count({ where: { organization_id: organizationId, status: 'pending' } }),
      this.membershipRepo.count({ where: { organization_id: organizationId, status: 'active', member_type: 'internal' } }),
      this.membershipRepo.count({ where: { organization_id: organizationId, status: 'active', member_type: 'external' } }),
    ]);

    const [eventsDraft, eventsPublished, eventsCancelled, eventsCompleted, eventsUpcoming] = await Promise.all([
      this.eventRepo.count({ where: { organization_id: organizationId, status: 'draft' } }),
      this.eventRepo.count({ where: { organization_id: organizationId, status: 'published' } }),
      this.eventRepo.count({ where: { organization_id: organizationId, status: 'cancelled' } }),
      this.eventRepo.count({ where: { organization_id: organizationId, status: 'completed' } }),
      this.eventRepo
        .createQueryBuilder('e')
        .where('e.organization_id = :organizationId', { organizationId })
        .andWhere('e.status = :status', { status: 'published' })
        .andWhere('e.start_date >= :today', { today })
        .getCount(),
    ]);

    const donationTotals = await this.donationRepo
      .createQueryBuilder('d')
      .innerJoin(Participation, 'p', 'p.id = d.participation_id')
      .where('p.organization_id = :organizationId', { organizationId })
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CASE WHEN d.payment_status = :recorded THEN d.amount ELSE 0 END), 0)', 'total_recorded')
      .addSelect('COALESCE(SUM(CASE WHEN d.payment_status = :pending THEN d.amount ELSE 0 END), 0)', 'total_pending')
      .setParameters({ recorded: 'recorded', pending: 'pending' })
      .getRawOne();

    const sponsorshipTotals = await this.sponsorshipRepo
      .createQueryBuilder('s')
      .innerJoin(Participation, 'p', 'p.id = s.participation_id')
      .where('p.organization_id = :organizationId', { organizationId })
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CASE WHEN s.payment_status = :recorded THEN s.amount_pledged ELSE 0 END), 0)', 'total_recorded')
      .addSelect('COALESCE(SUM(CASE WHEN s.payment_status = :pending THEN s.amount_pledged ELSE 0 END), 0)', 'total_pledged')
      .setParameters({ recorded: 'recorded', pending: 'pending' })
      .getRawOne();

    const [volunteerRolesOpen, volunteerRolesFilled, assignmentsPending, assignmentsApproved] = await Promise.all([
      this.volunteerRoleRepo.count({ where: { organization_id: organizationId, status: 'open' } }),
      this.volunteerRoleRepo.count({ where: { organization_id: organizationId, status: 'filled' } }),
      this.volunteerAssignmentRepo
        .createQueryBuilder('a')
        .innerJoin(VolunteerRole, 'r', 'r.id = a.volunteer_role_id')
        .where('r.organization_id = :organizationId', { organizationId })
        .andWhere('a.approval_status = :status', { status: 'pending' })
        .getCount(),
      this.volunteerAssignmentRepo
        .createQueryBuilder('a')
        .innerJoin(VolunteerRole, 'r', 'r.id = a.volunteer_role_id')
        .where('r.organization_id = :organizationId', { organizationId })
        .andWhere('a.approval_status = :status', { status: 'approved' })
        .getCount(),
    ]);

    return {
      members: { active: membersActive, pending: membersPending, internal: membersInternal, external: membersExternal },
      events: {
        draft: eventsDraft,
        published: eventsPublished,
        cancelled: eventsCancelled,
        completed: eventsCompleted,
        upcoming: eventsUpcoming,
      },
      donations: {
        count: Number(donationTotals?.count ?? 0),
        total_recorded: Number(donationTotals?.total_recorded ?? 0),
        total_pending: Number(donationTotals?.total_pending ?? 0),
      },
      sponsorships: {
        count: Number(sponsorshipTotals?.count ?? 0),
        total_recorded: Number(sponsorshipTotals?.total_recorded ?? 0),
        total_pledged: Number(sponsorshipTotals?.total_pledged ?? 0),
      },
      volunteers: {
        roles_open: volunteerRolesOpen,
        roles_filled: volunteerRolesFilled,
        assignments_pending: assignmentsPending,
        assignments_approved: assignmentsApproved,
      },
    };
  }

  async eventSummary(eventId: string, user: RequestUser) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    const [joinActive, bookActive, seatsBooked] = await Promise.all([
      this.participationRepo.count({ where: { event_id: eventId, type: 'join', status: 'active' } }),
      this.participationRepo.count({ where: { event_id: eventId, type: 'book', status: 'active' } }),
      this.participationRepo
        .createQueryBuilder('p')
        .innerJoin('booking', 'b', 'b.participation_id = p.id')
        .where('p.event_id = :eventId', { eventId })
        .andWhere('p.status = :status', { status: 'active' })
        .select('COALESCE(SUM(b.seats_requested), 0)', 'total')
        .getRawOne()
        .then((r) => Number(r?.total ?? 0)),
    ]);

    const donationTotals = await this.donationRepo
      .createQueryBuilder('d')
      .innerJoin(Participation, 'p', 'p.id = d.participation_id')
      .where('p.event_id = :eventId', { eventId })
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CASE WHEN d.payment_status = :recorded THEN d.amount ELSE 0 END), 0)', 'total_recorded')
      .setParameters({ recorded: 'recorded' })
      .getRawOne();

    const sponsorshipTotals = await this.sponsorshipRepo
      .createQueryBuilder('s')
      .innerJoin(Participation, 'p', 'p.id = s.participation_id')
      .where('p.event_id = :eventId', { eventId })
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CASE WHEN s.payment_status = :recorded THEN s.amount_pledged ELSE 0 END), 0)', 'total_recorded')
      .setParameters({ recorded: 'recorded' })
      .getRawOne();

    const [needsOpen, needsFulfilled, volunteerRoleCount, assignmentsApproved, assignmentsPending] = await Promise.all([
      this.sponsorshipRepo.manager.query('SELECT COUNT(*) FROM sponsorship_need WHERE event_id = $1 AND status = $2', [eventId, 'open']),
      this.sponsorshipRepo.manager.query('SELECT COUNT(*) FROM sponsorship_need WHERE event_id = $1 AND status = $2', [eventId, 'fulfilled']),
      this.volunteerRoleRepo.count({ where: { event_id: eventId } }),
      this.volunteerAssignmentRepo
        .createQueryBuilder('a')
        .innerJoin(VolunteerRole, 'r', 'r.id = a.volunteer_role_id')
        .where('r.event_id = :eventId', { eventId })
        .andWhere('a.approval_status = :status', { status: 'approved' })
        .getCount(),
      this.volunteerAssignmentRepo
        .createQueryBuilder('a')
        .innerJoin(VolunteerRole, 'r', 'r.id = a.volunteer_role_id')
        .where('r.event_id = :eventId', { eventId })
        .andWhere('a.approval_status = :status', { status: 'pending' })
        .getCount(),
    ]);

    return {
      event: { id: event.id, name: event.name, status: event.status },
      participations: { join_active: joinActive, book_active: bookActive, seats_booked: seatsBooked },
      donations: { count: Number(donationTotals?.count ?? 0), total_recorded: Number(donationTotals?.total_recorded ?? 0) },
      sponsorships: {
        count: Number(sponsorshipTotals?.count ?? 0),
        total_recorded: Number(sponsorshipTotals?.total_recorded ?? 0),
        needs_open: Number(needsOpen?.[0]?.count ?? 0),
        needs_fulfilled: Number(needsFulfilled?.[0]?.count ?? 0),
      },
      volunteers: { roles: volunteerRoleCount, assignments_approved: assignmentsApproved, assignments_pending: assignmentsPending },
    };
  }

  async platformSummary(user: RequestUser) {
    if (user.role !== 'master_admin') {
      throw new ApiError('Only the platform admin can view this dashboard', 403, 'FORBIDDEN');
    }

    const [orgsTotal, orgsActive, orgsSuspended, membersTotal, eventsTotal, eventsPublished] = await Promise.all([
      this.organizationRepo.count(),
      this.organizationRepo.count({ where: { organization_status: 'active' } }),
      this.organizationRepo.count({ where: { organization_status: 'suspended' } }),
      this.membershipRepo.count({ where: { status: 'active' } }),
      this.eventRepo.count(),
      this.eventRepo.count({ where: { status: 'published' } }),
    ]);

    const donationTotals = await this.donationRepo
      .createQueryBuilder('d')
      .select('COALESCE(SUM(CASE WHEN d.payment_status = :recorded THEN d.amount ELSE 0 END), 0)', 'total_recorded')
      .setParameters({ recorded: 'recorded' })
      .getRawOne();

    return {
      organizations: { total: orgsTotal, active: orgsActive, suspended: orgsSuspended },
      members_total: membersTotal,
      events: { total: eventsTotal, published: eventsPublished },
      donations_total_recorded: Number(donationTotals?.total_recorded ?? 0),
    };
  }
}
