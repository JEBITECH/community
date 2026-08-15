import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Event } from '../events/entities/event.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Sponsorship } from '../donations/entities/sponsorship.entity';
import { VolunteerRole } from '../volunteers/entities/volunteer-role.entity';
import { VolunteerAssignment } from '../volunteers/entities/volunteer-assignment.entity';
import { RequestUser } from '../common/middleware/user-context.middleware';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
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

  async eventsReport(user: RequestUser): Promise<Record<string, unknown>[]> {
    const organizationId = this.assertOrgScoped(user);
    const events = await this.eventRepo.find({ where: { organization_id: organizationId }, order: { start_date: 'DESC' } });

    const rows = await Promise.all(
      events.map(async (event) => {
        const [joins, bookings, donationTotal] = await Promise.all([
          this.participationRepo.count({ where: { event_id: event.id, type: 'join', status: 'active' } }),
          this.participationRepo.count({ where: { event_id: event.id, type: 'book', status: 'active' } }),
          this.donationRepo
            .createQueryBuilder('d')
            .innerJoin(Participation, 'p', 'p.id = d.participation_id')
            .where('p.event_id = :eventId', { eventId: event.id })
            .andWhere('d.payment_status = :status', { status: 'recorded' })
            .select('COALESCE(SUM(d.amount), 0)', 'total')
            .getRawOne()
            .then((r) => Number(r?.total ?? 0)),
        ]);
        return {
          event_id: event.id,
          name: event.name,
          event_type: event.event_type,
          status: event.status,
          start_date: event.start_date,
          venue: event.venue || '',
          joins,
          bookings,
          donations_recorded: donationTotal,
        };
      }),
    );
    return rows;
  }

  async financialReport(user: RequestUser): Promise<Record<string, unknown>[]> {
    const organizationId = this.assertOrgScoped(user);

    const donations = await this.donationRepo
      .createQueryBuilder('d')
      .innerJoin(Participation, 'p', 'p.id = d.participation_id')
      .innerJoin(Event, 'e', 'e.id = p.event_id')
      .where('p.organization_id = :organizationId', { organizationId })
      .select([
        'd.id AS id',
        'e.name AS event_name',
        'd.amount AS amount',
        'd.payment_status AS payment_status',
        'd.payment_method AS payment_method',
        'd.receipt_number AS receipt_number',
        'd.createdAt AS created_at',
      ])
      .getRawMany();

    const sponsorships = await this.sponsorshipRepo
      .createQueryBuilder('s')
      .innerJoin(Participation, 'p', 'p.id = s.participation_id')
      .innerJoin(Event, 'e', 'e.id = p.event_id')
      .where('p.organization_id = :organizationId', { organizationId })
      .select([
        's.id AS id',
        'e.name AS event_name',
        's.amount_pledged AS amount',
        's.payment_status AS payment_status',
        's.payment_method AS payment_method',
        's.receipt_number AS receipt_number',
        's.createdAt AS created_at',
      ])
      .getRawMany();

    const rows = [
      ...donations.map((d) => ({ type: 'donation', ...d })),
      ...sponsorships.map((s) => ({ type: 'sponsorship', ...s })),
    ];
    rows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return rows;
  }

  async volunteerReport(user: RequestUser): Promise<Record<string, unknown>[]> {
    const organizationId = this.assertOrgScoped(user);
    const roles = await this.volunteerRoleRepo.find({ where: { organization_id: organizationId }, order: { createdAt: 'DESC' } });

    const rows = await Promise.all(
      roles.map(async (role) => {
        const [approved, pending, rejected] = await Promise.all([
          this.volunteerAssignmentRepo.count({ where: { volunteer_role_id: role.id, approval_status: 'approved' } }),
          this.volunteerAssignmentRepo.count({ where: { volunteer_role_id: role.id, approval_status: 'pending' } }),
          this.volunteerAssignmentRepo.count({ where: { volunteer_role_id: role.id, approval_status: 'rejected' } }),
        ]);
        return {
          role_id: role.id,
          title: role.title,
          status: role.status,
          headcount_needed: role.headcount_needed,
          headcount_filled: role.headcount_filled,
          approved,
          pending,
          rejected,
        };
      }),
    );
    return rows;
  }
}
