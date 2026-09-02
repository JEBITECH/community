import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership, User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation, RegistrationMethod } from './entities/participation.entity';
import { ParticipationBeneficiary, BeneficiaryRelation } from './entities/participation-beneficiary.entity';
import { Booking } from './entities/booking.entity';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { CreatePublicParticipationDto } from './dto/create-public-participation.dto';
import { BeneficiaryDto } from './dto/beneficiary.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { assertGuestAudienceAllowed, resolveEffectiveAudience } from '../common/helpers/audience.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { GuestMembershipResolverService } from '../common/services/guest-membership-resolver.service';

const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Resolved, ready-to-persist beneficiary detail — the DTO after name/
 * membership lookups have been applied. */
interface ResolvedBeneficiary {
  relation_type: BeneficiaryRelation;
  full_name: string;
  membership_id: string | null;
  notes?: string;
}

function displayName(user: Pick<User, 'firstName' | 'lastName'>): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
}

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly membershipResolver: MembershipResolverService,
    private readonly guestMembershipResolver: GuestMembershipResolverService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventComponent) private readonly componentRepo: Repository<EventComponent>,
    @InjectRepository(Participation) private readonly participationRepo: Repository<Participation>,
    @InjectRepository(ParticipationBeneficiary) private readonly beneficiaryRepo: Repository<ParticipationBeneficiary>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(user: RequestUser, dto: CreateParticipationDto): Promise<Participation> {
    const membership = await this.membershipResolver.resolve(user);
    const { event, component } = await this.loadEventAndComponent(dto.event_id, dto.event_component_id);
    assertTenantMatch(event.organization_id, user);
    if (dto.event_component_id) {
      assertTenantMatch(component!.organization_id, user);
    }
    const beneficiaries = await this.resolveBeneficiaries(membership, event.organization_id, dto.beneficiaries);
    return this.createForMembership(
      membership,
      event,
      component,
      dto.type,
      dto.seats_requested,
      dto.mode,
      dto.registration_method,
      beneficiaries,
    );
  }

  async createGuest(dto: CreatePublicParticipationDto): Promise<Participation> {
    const { event, component } = await this.loadEventAndComponent(dto.event_id, dto.event_component_id);
    assertGuestAudienceAllowed(resolveEffectiveAudience(event, component?.eventDay, component));
    const membership = await this.guestMembershipResolver.resolve(event.organization_id, dto.guest);
    // A guest has no organization to grant lookup rights against, so their
    // beneficiaries may never carry a membership_id — resolveBeneficiaries
    // enforces this by rejecting any non-self membership_id whose
    // organization doesn't match, which a guest can never satisfy unless the
    // ID happens to belong to this org (then it's a legitimate existing
    // member being registered by a guest on their behalf, which is fine).
    const beneficiaries = await this.resolveBeneficiaries(membership, event.organization_id, dto.beneficiaries);
    return this.createForMembership(
      membership,
      event,
      component,
      dto.type,
      dto.seats_requested,
      dto.mode,
      dto.registration_method,
      beneficiaries,
    );
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

  /**
   * Turns the raw beneficiary DTOs into persistable rows:
   *  - 'self' always resolves to the *caller's own* membership/name — a
   *    client-supplied full_name or membership_id for 'self' is ignored, not
   *    trusted, matching "if self the name is added automatically".
   *  - 'family' / 'other' resolve their name from a supplied membership_id
   *    when it points at a real membership in the same organization
   *    ("option to add ... the membership id, to fetch the data"); otherwise
   *    the caller must type a full_name by hand.
   * Returns undefined when no beneficiaries were supplied at all, so
   * createForMembership can fall back to the legacy plain-seat-count path.
   */
  private async resolveBeneficiaries(
    membership: Membership,
    organizationId: number,
    dtos: BeneficiaryDto[] | undefined,
  ): Promise<ResolvedBeneficiary[] | undefined> {
    if (!dtos || dtos.length === 0) {
      return undefined;
    }

    const selfCount = dtos.filter((d) => d.relation_type === 'self').length;
    if (selfCount > 1) {
      throw new ApiError('Only one "self" beneficiary is allowed per registration', 400, 'DUPLICATE_SELF_BENEFICIARY');
    }

    let selfUser: User | null = null;
    if (selfCount === 1) {
      selfUser = await this.userRepo.findOne({ where: { id: membership.user_id } });
    }

    const resolved: ResolvedBeneficiary[] = [];
    for (const dto of dtos) {
      if (dto.relation_type === 'self') {
        resolved.push({
          relation_type: 'self',
          full_name: selfUser ? displayName(selfUser) || 'Member' : 'Member',
          membership_id: membership.id,
        });
        continue;
      }

      if (dto.membership_id) {
        const target = await this.membershipRepo.findOne({ where: { id: dto.membership_id } });
        if (!target || target.organization_id !== organizationId) {
          throw new ApiError(
            `Could not find a member in this organization for the supplied membership ID`,
            404,
            'BENEFICIARY_MEMBERSHIP_NOT_FOUND',
          );
        }
        const targetUser = await this.userRepo.findOne({ where: { id: target.user_id } });
        resolved.push({
          relation_type: dto.relation_type,
          full_name: (targetUser && displayName(targetUser)) || dto.full_name?.trim() || 'Member',
          membership_id: target.id,
          notes: dto.notes,
        });
        continue;
      }

      if (!dto.full_name || !dto.full_name.trim()) {
        throw new ApiError(
          `A name is required for each ${dto.relation_type} beneficiary (or supply their membership ID)`,
          400,
          'BENEFICIARY_NAME_REQUIRED',
        );
      }
      resolved.push({
        relation_type: dto.relation_type,
        full_name: dto.full_name.trim(),
        membership_id: null,
        notes: dto.notes,
      });
    }

    return resolved;
  }

  private async createForMembership(
    membership: Membership,
    event: Event,
    component: EventComponent | null,
    type: 'join' | 'book',
    seatsRequestedInput: number | undefined,
    modeInput: 'single' | 'multiple' | undefined,
    registrationMethodInput: 'join' | 'participate' | undefined,
    beneficiaries: ResolvedBeneficiary[] | undefined,
  ): Promise<Participation> {
    if (event.status !== 'published') {
      throw new ApiError('This event is not open for registration', 409, 'EVENT_NOT_PUBLISHED');
    }

    const registrationMethod: RegistrationMethod = type === 'book'
      ? 'book'
      : registrationMethodInput ?? (beneficiaries?.length ? 'participate' : 'join');

    if (type === 'join') {
      if (registrationMethod === 'join') {
        if (beneficiaries?.length) {
          throw new ApiError('Quick Join cannot include participant details; use Participate instead', 400, 'BENEFICIARIES_NOT_ALLOWED_FOR_JOIN');
        }
        const joinAllowed = component ? component.registration_enabled : event.registration_required;
        if (!joinAllowed) {
          throw new ApiError('Join is not enabled for this activity', 409, 'JOIN_DISABLED');
        }
      } else if (registrationMethod === 'participate') {
        if (!component?.participation_enabled) {
          throw new ApiError('Participate is not enabled for this activity', 409, 'PARTICIPATION_DISABLED');
        }
        if (!beneficiaries || beneficiaries.length === 0) {
          throw new ApiError('At least one participant is required', 400, 'BENEFICIARIES_REQUIRED');
        }
      } else {
        throw new ApiError('Invalid registration method', 400, 'INVALID_REGISTRATION_METHOD');
      }
    }
    if (type === 'book') {
      if (!component) {
        throw new ApiError('A component must be specified to make a booking', 400, 'COMPONENT_REQUIRED');
      }
      if (!component.requires_booking) {
        throw new ApiError('This activity does not accept bookings', 409, 'BOOKING_DISABLED');
      }
    }

    const capacity = component ? component.capacity : event.capacity;

    // party_size: how many people this one participation covers. Beneficiary
    // detail is authoritative when present; otherwise fall back to the plain
    // seat count (defaulting to 1), same as before this feature existed.
    const partySize = registrationMethod === 'join'
      ? 1
      : beneficiaries
        ? beneficiaries.length
        : seatsRequestedInput ?? 1;
    const mode: 'single' | 'multiple' = modeInput ?? (partySize > 1 ? 'multiple' : 'single');
    if (registrationMethod === 'participate' && (!beneficiaries || beneficiaries.length === 0)) {
      throw new ApiError('At least one participant is required', 400, 'BENEFICIARIES_REQUIRED');
    }
    if (mode === 'single' && partySize > 1) {
      throw new ApiError('A "single" registration can only cover one beneficiary', 400, 'MODE_BENEFICIARY_MISMATCH');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const existing = await manager.findOne(Participation, {
          where: {
            membership_id: membership.id,
            event_id: event.id,
            event_component_id: component?.id ?? null,
            type,
            status: 'active',
          },
        });
        if (existing) {
          const existingMethod = existing.registration_method || (existing.type === 'book' ? 'book' : 'join');
          throw new ApiError(
            existingMethod === 'participate'
              ? 'You have already registered using Participate for this activity'
              : existingMethod === 'join'
                ? 'You have already joined this activity'
                : 'You have already registered for this activity',
            409,
            'ALREADY_REGISTERED',
          );
        }
        if (capacity != null) {
          // Lock the capacity-bearing row so two concurrent requests can't both
          // read "N seats free" and both insert, over-booking the component.
          if (component) {
            await manager.query('SELECT id FROM event_component WHERE id = $1 FOR UPDATE', [component.id]);
          } else {
            await manager.query('SELECT id FROM event WHERE id = $1 FOR UPDATE', [event.id]);
          }

          const usedSeats = await this.countActiveSeats(manager, event.id, component?.id ?? null, type);
          if (usedSeats + partySize > capacity) {
            throw new ApiError(
              type === 'book' ? 'This activity is fully booked' : 'This activity is at full capacity',
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
          type,
          registration_method: registrationMethod,
          status: 'active',
          mode,
          party_size: partySize,
        });
        const savedParticipation = await manager.save(participation);

        if (beneficiaries) {
          const rows = beneficiaries.map((b) =>
            manager.create(ParticipationBeneficiary, {
              participation_id: savedParticipation.id,
              relation_type: b.relation_type,
              full_name: b.full_name,
              membership_id: b.membership_id,
              notes: b.notes,
            }),
          );
          await manager.save(rows);
        }

        if (type === 'book') {
          const booking = manager.create(Booking, {
            participation_id: savedParticipation.id,
            seats_requested: partySize,
          });
          await manager.save(booking);
        }

        return manager.findOneOrFail(Participation, {
          where: { id: savedParticipation.id },
          relations: ['beneficiaries'],
        });
      });
    } catch (err: any) {
      if (err?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ApiError('You have already registered for this', 409, 'ALREADY_REGISTERED');
      }
      throw err;
    }
  }

  /** Sums currently-active seats for a capacity check. Both 'join' and
   * 'book' now sum participation.party_size — a "multiple" Join/Participate
   * consumes as many seats as it has beneficiaries, same as a multi-seat
   * booking always has. Scoping is by component_id when given (that alone
   * uniquely identifies the capacity pool); otherwise by event_id with
   * component_id IS NULL, for event-level capacity. */
  private async countActiveSeats(
    manager: EntityManager,
    eventId: string,
    componentId: string | null,
    type: 'join' | 'book',
  ): Promise<number> {
    const scopeQuery = <T extends { andWhere: (...args: any[]) => T }>(qb: T): T =>
      componentId
        ? qb.andWhere('p.event_component_id = :componentId', { componentId })
        : qb.andWhere('p.event_id = :eventId AND p.event_component_id IS NULL', { eventId });

    const result = await scopeQuery(
      manager
        .createQueryBuilder(Participation, 'p')
        .where('p.type = :type', { type })
        .andWhere('p.status = :status', { status: 'active' }),
    )
      .select('COALESCE(SUM(p.party_size), 0)', 'total')
      .getRawOne();

    return Number(result?.total ?? 0);
  }

  async findMine(
    user: RequestUser,
    type?: string,
    registrationMethod?: RegistrationMethod,
  ): Promise<Participation[]> {
    const membership = await this.membershipResolver.resolve(user);
    return this.participationRepo.find({
      where: {
        membership_id: membership.id,
        ...(type ? { type: type as Participation['type'] } : {}),
        ...(registrationMethod ? { registration_method: registrationMethod } : {}),
      },
      relations: ['beneficiaries'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, user: RequestUser, dto: UpdateParticipationDto): Promise<Participation> {
    const membership = await this.membershipResolver.resolve(user);
    const participation = await this.participationRepo.findOne({
      where: { id },
      relations: ['beneficiaries'],
    });
    if (!participation) {
      throw new ApiError('Participation not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(participation.organization_id, user);
    if (participation.membership_id !== membership.id) {
      throw new ApiError('You can only edit your own registration', 403, 'FORBIDDEN');
    }
    if (participation.status !== 'active') {
      throw new ApiError(`Cannot edit a participation with status "${participation.status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }
    if (participation.registration_method !== 'participate') {
      throw new ApiError('Only detailed Participate registrations can be edited', 409, 'PARTICIPATION_NOT_EDITABLE');
    }
    if (!dto.beneficiaries || dto.beneficiaries.length === 0) {
      throw new ApiError('At least one participant is required', 400, 'BENEFICIARIES_REQUIRED');
    }

    const event = await this.eventRepo.findOne({ where: { id: participation.event_id } });
    if (!event) throw new ApiError('Event not found', 404, 'NOT_FOUND');
    if (event.status !== 'published') {
      throw new ApiError('This event is not open for participation changes', 409, 'EVENT_NOT_PUBLISHED');
    }
    const component = participation.event_component_id
      ? await this.componentRepo.findOne({ where: { id: participation.event_component_id }, relations: ['eventDay'] })
      : null;
    if (participation.event_component_id && !component) {
      throw new ApiError('Activity not found', 404, 'NOT_FOUND');
    }
    if (participation.registration_method === 'participate' && !component?.participation_enabled) {
      throw new ApiError('Participate is no longer enabled for this activity', 409, 'PARTICIPATION_DISABLED');
    }

    const beneficiaries = await this.resolveBeneficiaries(membership, event.organization_id, dto.beneficiaries);
    const partySize = beneficiaries?.length ?? 0;
    const mode = dto.mode ?? (partySize > 1 ? 'multiple' : 'single');
    if (mode === 'single' && partySize !== 1) {
      throw new ApiError('A "single" registration must contain exactly one participant', 400, 'MODE_BENEFICIARY_MISMATCH');
    }
    if (mode === 'multiple' && partySize < 1) {
      throw new ApiError('A "multiple" registration must contain at least one participant', 400, 'MODE_BENEFICIARY_MISMATCH');
    }

    const capacity = component ? component.capacity : event.capacity;
    return this.dataSource.transaction(async (manager) => {
      if (capacity != null) {
        if (component) {
          await manager.query('SELECT id FROM event_component WHERE id = $1 FOR UPDATE', [component.id]);
        } else {
          await manager.query('SELECT id FROM event WHERE id = $1 FOR UPDATE', [event.id]);
        }
        const result = await manager
          .createQueryBuilder(Participation, 'p')
          .where('p.type = :type', { type: participation.type })
          .andWhere('p.status = :status', { status: 'active' })
          .andWhere('p.id <> :participationId', { participationId: participation.id })
          .andWhere(component
            ? 'p.event_component_id = :componentId'
            : 'p.event_id = :eventId AND p.event_component_id IS NULL',
            component ? { componentId: component.id } : { eventId: event.id },
          )
          .select('COALESCE(SUM(p.party_size), 0)', 'total')
          .getRawOne();
        const usedSeats = Number(result?.total ?? 0);
        if (usedSeats + partySize > capacity) {
          throw new ApiError('This activity does not have enough remaining capacity for the updated participant list', 409, 'CAPACITY_EXCEEDED');
        }
      }

      participation.mode = mode;
      participation.party_size = partySize;
      const saved = await manager.save(participation);
      await manager.delete(ParticipationBeneficiary, { participation_id: saved.id });
      const rows = beneficiaries!.map((b) =>
        manager.create(ParticipationBeneficiary, {
          participation_id: saved.id,
          relation_type: b.relation_type,
          full_name: b.full_name,
          membership_id: b.membership_id,
          notes: b.notes,
        }),
      );
      await manager.save(rows);

      return manager.findOneOrFail(Participation, {
        where: { id: saved.id },
        relations: ['beneficiaries'],
      });
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

  /**
   * Admin-facing breakdown for a single component: who joined vs who
   * participated (with beneficiary detail) vs who booked, satisfying "when
   * an activity is joined, in backend we have to store who all have
   * selected joined and participated, a report should be displayed".
   */
  async componentReport(componentId: string, user: RequestUser): Promise<{
    component_id: string;
    total_registrations: number;
    total_people: number;
    registrations: Array<{
      participation_id: string;
      membership_id: string;
      type: Participation['type'];
      registration_method: RegistrationMethod;
      mode: Participation['mode'];
      status: Participation['status'];
      party_size: number;
      created_at: Date;
      beneficiaries: Array<{ relation_type: BeneficiaryRelation; full_name: string; membership_id: string | null }>;
    }>;
  }> {
    const component = await this.componentRepo.findOne({ where: { id: componentId } });
    if (!component) {
      throw new ApiError('Component not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(component.organization_id, user);

    const participations = await this.participationRepo.find({
      where: { event_component_id: componentId },
      relations: ['beneficiaries'],
      order: { createdAt: 'ASC' },
    });

    const active = participations.filter((p) => p.status !== 'cancelled');
    return {
      component_id: componentId,
      total_registrations: active.length,
      total_people: active.reduce((sum, p) => sum + p.party_size, 0),
      registrations: participations.map((p) => ({
        participation_id: p.id,
        membership_id: p.membership_id,
        type: p.type,
        registration_method: p.registration_method,
        mode: p.mode,
        status: p.status,
        party_size: p.party_size,
        created_at: p.createdAt,
        beneficiaries: (p.beneficiaries ?? []).map((b) => ({
          relation_type: b.relation_type,
          full_name: b.full_name,
          membership_id: b.membership_id ?? null,
        })),
      })),
    };
  }
}