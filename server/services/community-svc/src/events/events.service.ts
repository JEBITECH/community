import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership, Organization } from '@shared/entities';
import { Event } from './entities/event.entity';
import { EventDay } from './entities/event-day.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { NotificationClientService } from '../common/services/notification-client.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventDay) private readonly eventDayRepo: Repository<EventDay>,
    @InjectRepository(Organization) private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    private readonly notificationClient: NotificationClientService,
  ) {}

  async create(user: RequestUser, dto: CreateEventDto): Promise<Event> {
    if (user.organization_id == null) {
      throw new ApiError('An active organization membership is required to create events', 403, 'NO_ACTIVE_ORG');
    }
    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new ApiError('end_date cannot be before start_date', 400, 'INVALID_DATE_RANGE');
    }

    const event = this.eventRepo.create({
      organization_id: user.organization_id,
      name: dto.name,
      description: dto.description,
      event_type: dto.event_type as Event['event_type'],
      is_multi_day: dto.is_multi_day ?? false,
      start_date: dto.start_date,
      end_date: dto.end_date,
      venue: dto.venue,
      timezone: dto.timezone ?? 'Asia/Kolkata',
      cover_image_url: dto.cover_image_url,
      capacity: dto.capacity,
      audience: (dto.audience as Event['audience']) ?? 'internal',
      registration_required: dto.registration_required ?? true,
      booking_enabled: dto.booking_enabled ?? false,
      donation_enabled: dto.donation_enabled ?? false,
      volunteer_enabled: dto.volunteer_enabled ?? false,
      sponsorship_enabled: dto.sponsorship_enabled ?? false,
      status: 'draft',
      created_by_user_id: user.id,
    });
    const saved = await this.eventRepo.save(event);

    // A single-day event is just an Event with one auto-created Day, so the
    // create-activity wizard and the multi-day festival builder share one API.
    if (!saved.is_multi_day) {
      const day = this.eventDayRepo.create({
        event_id: saved.id,
        day_number: 1,
        date: saved.start_date,
        title: 'Day 1',
      });
      await this.eventDayRepo.save(day);
    }

    return this.findOne(saved.id, user);
  }

  async findAll(user: RequestUser, filters: { status?: string; event_type?: string }): Promise<Event[]> {
    if (user.organization_id == null && user.role !== 'master_admin') {
      throw new ApiError('An active organization membership is required', 403, 'NO_ACTIVE_ORG');
    }

    return this.eventRepo.find({
      where: {
        ...(user.organization_id != null ? { organization_id: user.organization_id } : {}),
        ...(filters.status ? { status: filters.status as Event['status'] } : {}),
        ...(filters.event_type ? { event_type: filters.event_type as Event['event_type'] } : {}),
      },
      order: { start_date: 'DESC' },
    });
  }

  async findForCalendar(user: RequestUser, from: string, to: string): Promise<Event[]> {
    if (user.organization_id == null && user.role !== 'master_admin') {
      throw new ApiError('An active organization membership is required', 403, 'NO_ACTIVE_ORG');
    }
    if (isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
      throw new ApiError('from and to must be valid dates', 400, 'VALIDATION_ERROR');
    }

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .where('event.start_date <= :to', { to })
      .andWhere('event.end_date >= :from', { from })
      .andWhere('event.status != :cancelled', { cancelled: 'cancelled' });

    if (user.organization_id != null) {
      qb.andWhere('event.organization_id = :organizationId', { organizationId: user.organization_id });
    }

    return qb.orderBy('event.start_date', 'ASC').getMany();
  }

  async findPublishedBySubdomain(subdomain: string): Promise<Event[]> {
    const organization = await this.organizationRepo.findOne({ where: { subdomain, is_archived: false } });
    if (!organization || organization.organization_status !== 'active') {
      throw new ApiError('Community not found', 404, 'NOT_FOUND');
    }
    return this.findPublished(organization.id);
  }

  async findPublished(organizationId: number): Promise<Event[]> {
    return this.eventRepo
      .createQueryBuilder('event')
      .where('event.organization_id = :organizationId', { organizationId })
      .andWhere('event.status = :status', { status: 'published' })
      .andWhere('event.audience IN (:...audiences)', { audiences: ['public', 'internal_external'] })
      .orderBy('event.start_date', 'ASC')
      .getMany();

  }

  async findOne(id: string, user: RequestUser): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['days', 'days.components'],
    });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);
    return event;
  }

  async findOnePublic(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id }, relations: ['days', 'days.components'] });
    if (!event || event.status !== 'published' || !['public', 'internal_external'].includes(event.audience)) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    return event;
  }

  async getSchedule(id: string, user: RequestUser): Promise<EventDay[]> {
    const event = await this.findOne(id, user);
    return this.eventDayRepo.find({
      where: { event_id: event.id },
      relations: ['components'],
      order: { day_number: 'ASC' },
    });
  }

  async update(id: string, user: RequestUser, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id, user);
    if (event.status === 'cancelled') {
      throw new ApiError('Cannot edit a cancelled event', 409, 'EVENT_CANCELLED');
    }

    Object.assign(event, {
      ...dto,
      event_type: (dto.event_type as Event['event_type']) ?? event.event_type,
      audience: (dto.audience as Event['audience']) ?? event.audience,
    });

    if (new Date(event.end_date) < new Date(event.start_date)) {
      throw new ApiError('end_date cannot be before start_date', 400, 'INVALID_DATE_RANGE');
    }

    return this.eventRepo.save(event);
  }

  async publish(id: string, user: RequestUser): Promise<Event> {
    const event = await this.findOne(id, user);
    if (event.status !== 'draft') {
      throw new ApiError(`Cannot publish an event with status "${event.status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }
    event.status = 'published';
    event.published_at = new Date();
    const saved = await this.eventRepo.save(event);

    const members = await this.membershipRepo.find({
      where: { organization_id: event.organization_id, status: 'active' },
      select: ['user_id'],
    });
    if (members.length > 0) {
      this.notificationClient.send({
        eventType: 'community.event_published',
        organizationId: event.organization_id,
        eventId: event.id,
        recipients: members.map((m) => ({ userId: m.user_id })),
        title: `New event: ${event.name}`,
        body: `${event.name} has been published for ${event.start_date}${event.venue ? ` at ${event.venue}` : ''}.`,
      });
    }

    return saved;
  }

  async cancel(id: string, user: RequestUser): Promise<Event> {
    const event = await this.findOne(id, user);
    if (event.status === 'cancelled' || event.status === 'completed') {
      throw new ApiError(`Cannot cancel an event with status "${event.status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }
    // Soft delete only: an event with participations must never be hard-deleted.
    event.status = 'cancelled';
    return this.eventRepo.save(event);
  }
}
