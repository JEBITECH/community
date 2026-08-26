import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from './entities/participation.entity';
import { Booking } from './entities/booking.entity';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { CreatePublicParticipationDto } from './dto/create-public-participation.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { assertGuestAudienceAllowed, resolveEffectiveAudience } from '../common/helpers/audience.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { GuestMembershipResolverService } from '../common/services/guest-membership-resolver.service';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly membershipResolver: MembershipResolverService,
    private readonly guestMembershipResolver: GuestMembershipResolverService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventComponent) private readonly componentRepo: Repository<EventComponent>,
    @InjectRepository(Participation) private readonly participationRepo: Repository<Participation>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
  ) {}

  async create(user: RequestUser, dto: CreateParticipationDto): Promise<Participation> {
    const membership = await this.membershipResolver.resolve(user);
    const { event, component } = await this.loadEventAndComponent(dto.event_id, dto.event_component_id);
    assertTenantMatch(event.organization_id, user);
    if (dto.event_component_id) {
      assertTenantMatch(component!.organization_id, user);
    }
    return this.createForMembership(membership, event, component, dto.type, dto.seats_requested);
  }

  async createGuest(dto: CreatePublicParticipationDto): Promise<Participation> {
    const { event, component } = await this.loadEventAndComponent(dto.event_id, dto.event_component_id);
    assertGuestAudienceAllowed(resolveEffectiveAudience(event, component?.eventDay, component));
    const membership = await this.guestMembershipResolver.resolve(event.organization_id, dto.guest);
    return this.createForMembership(membership, event, component, dto.type, dto.seats_requested);
  }

  private async loadEventAndComponent(
    eventId: string,
    componentId: string | undefined,
  ): Promise<{ event: Event; component: EventComponent | null }> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }

    let component: EventComponent | null = null;
    if (componentId) {
      // relations: ['eventDay'] is required here so resolveEffectiveAudience()
      // can fall back to the parent day's audience override when the component itself doesn't set one.
      component = await this.componentRepo.findOne({ where: { id: componentId }, relations: ['eventDay'] });
      if (!component) {
        throw new ApiError('Component not found', 404, 'NOT_FOUND');
      }
    }
    return { event, component };
  }

  private async createForMembership(
    membership: Membership,
    event: Event,
    component: EventComponent | null,
    type: 'join' | 'book',
    seatsRequestedInput: number | undefined,
  ): Promise<Participation> {
    if (event.status !== 'published') {
      throw new ApiError('This event is not open for registration', 409, 'EVENT_NOT_PUBLISHED');
    }

    if (type === 'join' && !(component ? component.registration_enabled : event.registration_required)) {
      throw new ApiError('Registration is not enabled for this activity', 409, 'REGISTRATION_DISABLED');
    }
    if (type === 'book') {
      if (!component) {
        throw new ApiError('A component must be specified to make a booking', 400, 'COMPONENT_REQUIRED');
      }
      if (!component.requires_booking) {
        throw new ApiError('This activity does not accept bookings', 409, 'BOOKING_DISABLED');
      }
    }

    const dto = { type, seats_requested: seatsRequestedInput };
    const capacity = component ? component.capacity : event.capacity;
    const seatsRequested = dto.type === 'book' ? dto.seats_requested ?? 1 : 1;

    try {
      return await this.dataSource.transaction(async (manager) => {
        if (capacity != null) {
          // Lock the capacity-bearing row so two concurrent requests can't both
          // read "N seats free" and both insert, over-booking the component.
          if (component) {
            await manager.query('SELECT id FROM event_component WHERE id = $1 FOR UPDATE', [component.id]);
          } else {
            await manager.query('SELECT id FROM event WHERE id = $1 FOR UPDATE', [event.id]);
          }

          const usedSeats = await this.countActiveSeats(manager, event.id, component?.id ?? null, dto.type as 'join' | 'book');
          if (usedSeats + seatsRequested > capacity) {
            throw new ApiError(
              dto.type === 'book' ? 'This activity is fully booked' : 'This activity is at full capacity',
              409,
              'CAPACITY_EXCEEDED',
            );
          }
        }

        const participation = manager.create(Participation, {
          organization_id: event.organization_id,
          event_id: event.id,
          event_component_id: component?.id ?? null,
          membership_id: membership.id,
          type: dto.type,
          status: 'active',
        });
        const savedParticipation = await manager.save(participation);

        if (dto.type === 'book') {
          const booking = manager.create(Booking, {
            participation_id: savedParticipation.id,
            seats_requested: seatsRequested,
          });
          await manager.save(booking);
        }

        return savedParticipation;
      });
    } catch (err: any) {
      if (err?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ApiError('You have already registered for this', 409, 'ALREADY_REGISTERED');
      }
      throw err;
    }
  }

  /** Sums currently-active seats for a capacity check: 1 per join/attendee, or
   * the requested seat count for bookings. Scoping is by component_id when
   * given (that alone uniquely identifies the capacity pool); otherwise by
   * event_id with component_id IS NULL, for event-level capacity. */
  private async countActiveSeats(
    manager: DataSource['manager'],
    eventId: string,
    componentId: string | null,
    type: 'join' | 'book',
  ): Promise<number> {
    const scopeQuery = <T extends { andWhere: (...args: any[]) => T }>(qb: T): T =>
      componentId
        ? qb.andWhere('p.event_component_id = :componentId', { componentId })
        : qb.andWhere('p.event_id = :eventId AND p.event_component_id IS NULL', { eventId });

    if (type === 'join') {
      return scopeQuery(
        manager
          .createQueryBuilder(Participation, 'p')
          .where('p.type = :type', { type: 'join' })
          .andWhere('p.status = :status', { status: 'active' }),
      ).getCount();
    }

    const result = await scopeQuery(
      manager
        .createQueryBuilder(Booking, 'b')
        .innerJoin(Participation, 'p', 'p.id = b.participation_id')
        .where('p.type = :type', { type: 'book' })
        .andWhere('p.status = :status', { status: 'active' }),
    )
      .select('COALESCE(SUM(b.seats_requested), 0)', 'total')
      .getRawOne();

    return Number(result?.total ?? 0);
  }

  async findMine(user: RequestUser, type?: string): Promise<Participation[]> {
    const membership = await this.membershipResolver.resolve(user);
    return this.participationRepo.find({
      where: { membership_id: membership.id, ...(type ? { type: type as Participation['type'] } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(id: string, user: RequestUser): Promise<Participation> {
    const membership = await this.membershipResolver.resolve(user);
    const participation = await this.participationRepo.findOne({ where: { id } });
    if (!participation) {
      throw new ApiError('Participation not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(participation.organization_id, user);

    const isOwner = participation.membership_id === membership.id;
    const isAdmin = user.role === 'super_admin' || user.role === 'core_committee' || user.role === 'master_admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError('You can only cancel your own registration', 403, 'FORBIDDEN');
    }
    if (participation.status !== 'active') {
      throw new ApiError(`Cannot cancel a participation with status "${participation.status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }

    participation.status = 'cancelled';
    await this.participationRepo.save(participation);

    if (participation.type === 'book') {
      await this.bookingRepo.update({ participation_id: participation.id }, { cancelled_at: new Date() });
    }

    return participation;
  }

  async availability(componentId: string, user: RequestUser): Promise<{ capacity: number | null; used: number; available: number | null }> {
    const component = await this.componentRepo.findOne({ where: { id: componentId } });
    if (!component) {
      throw new ApiError('Component not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(component.organization_id, user);

    const type = component.requires_booking ? 'book' : 'join';
    // eventId is unused when componentId is set — see countActiveSeats' scoping rule.
    const used = await this.countActiveSeats(this.dataSource.manager, '', component.id, type);
    return {
      capacity: component.capacity ?? null,
      used,
      available: component.capacity != null ? Math.max(0, component.capacity - used) : null,
    };
  }

  async attend(qrCodeToken: string, user: RequestUser): Promise<Participation> {
    const participation = await this.participationRepo.findOne({ where: { qr_code_token: qrCodeToken } });
    if (!participation) {
      throw new ApiError('Invalid QR code', 404, 'NOT_FOUND');
    }
    assertTenantMatch(participation.organization_id, user);

    if (participation.status === 'attended') {
      throw new ApiError('This participant has already been checked in', 409, 'ALREADY_ATTENDED');
    }
    if (participation.status === 'cancelled') {
      throw new ApiError('This registration was cancelled', 410, 'PARTICIPATION_CANCELLED');
    }

    participation.status = 'attended';
    participation.attended_at = new Date();
    return this.participationRepo.save(participation);
  }
}
