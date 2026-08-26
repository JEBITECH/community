import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Donation } from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreatePublicDonationDto } from './dto/create-public-donation.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { assertGuestAudienceAllowed, resolveEffectiveAudience } from '../common/helpers/audience.helper';
import { assertValidPaymentTransition, generateReceiptNumber } from '../common/helpers/payment-state.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { GuestMembershipResolverService } from '../common/services/guest-membership-resolver.service';
import { NotificationClientService } from '../common/services/notification-client.service';

@Injectable()
export class DonationsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly membershipResolver: MembershipResolverService,
    private readonly guestMembershipResolver: GuestMembershipResolverService,
    private readonly notificationClient: NotificationClientService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventComponent) private readonly componentRepo: Repository<EventComponent>,
    @InjectRepository(Participation) private readonly participationRepo: Repository<Participation>,
    @InjectRepository(Donation) private readonly donationRepo: Repository<Donation>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
  ) {}

  async create(user: RequestUser, dto: CreateDonationDto): Promise<Donation> {
    const membership = await this.membershipResolver.resolve(user);
    const { event, component } = await this.loadAndValidate(dto.event_id, dto.event_component_id);
    assertTenantMatch(event.organization_id, user);
    if (component) {
      assertTenantMatch(component.organization_id, user);
    }
    return this.createForMembership(membership, event, component, dto.amount, dto.purpose);
  }

  async createGuest(dto: CreatePublicDonationDto): Promise<Donation> {
    const { event, component } = await this.loadAndValidate(dto.event_id, dto.event_component_id);
    assertGuestAudienceAllowed(resolveEffectiveAudience(event, component?.eventDay, component));
    const membership = await this.guestMembershipResolver.resolve(event.organization_id, dto.guest);
    return this.createForMembership(membership, event, component, dto.amount, dto.purpose);
  }

  private async loadAndValidate(
    eventId: string,
    componentId: string | undefined,
  ): Promise<{ event: Event; component: EventComponent | null }> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    if (event.status !== 'published') {
      throw new ApiError('This event is not accepting donations', 409, 'EVENT_NOT_PUBLISHED');
    }

    let component: EventComponent | null = null;
    if (componentId) {
      // relations: ['eventDay'] lets resolveEffectiveAudience() fall back to
      // the parent day's audience override when the component doesn't set one.
      component = await this.componentRepo.findOne({ where: { id: componentId }, relations: ['eventDay'] });
      if (!component) {
        throw new ApiError('Component not found', 404, 'NOT_FOUND');
      }
      if (!component.donation_enabled) {
        throw new ApiError('This activity does not accept donations', 409, 'DONATIONS_DISABLED');
      }
    } else if (!event.donation_enabled) {
      throw new ApiError('This event does not accept donations', 409, 'DONATIONS_DISABLED');
    }
    return { event, component };
  }

  private async createForMembership(
    membership: Membership,
    event: Event,
    component: EventComponent | null,
    amount: number,
    purpose: string | undefined,
  ): Promise<Donation> {
    return this.dataSource.transaction(async (manager) => {
      const participation = await manager.save(
        manager.create(Participation, {
          organization_id: event.organization_id,
          event_id: event.id,
          event_component_id: component?.id ?? null,
          membership_id: membership.id,
          type: 'donate',
          status: 'active',
        }),
      );

      return manager.save(
        manager.create(Donation, {
          participation_id: participation.id,
          amount,
          purpose: (purpose as Donation['purpose']) ?? (component ? 'component' : 'event'),
          payment_status: 'pending',
        }),
      );
    });
  }

  private async loadWithTenantCheck(id: string, user: RequestUser): Promise<{ donation: Donation; participation: Participation }> {
    const donation = await this.donationRepo.findOne({ where: { id } });
    if (!donation) {
      throw new ApiError('Donation not found', 404, 'NOT_FOUND');
    }
    const participation = await this.participationRepo.findOne({ where: { id: donation.participation_id } });
    if (!participation) {
      throw new ApiError('Donation not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(participation.organization_id, user);
    return { donation, participation };
  }

  async recordPayment(id: string, user: RequestUser, dto: RecordPaymentDto): Promise<Donation> {
    const { donation, participation } = await this.loadWithTenantCheck(id, user);
    assertValidPaymentTransition(donation.payment_status, dto.payment_status);

    donation.payment_status = dto.payment_status;
    donation.payment_method = dto.payment_method as Donation['payment_method'];
    donation.recorded_by_user_id = user.id;
    donation.recorded_at = new Date();
    if (dto.payment_status === 'recorded' && !donation.receipt_number) {
      donation.receipt_number = generateReceiptNumber('DON');
    }

    const saved = await this.donationRepo.save(donation);

    if (dto.payment_status === 'recorded') {
      const membership = await this.membershipRepo.findOne({ where: { id: participation.membership_id } });
      if (membership) {
        this.notificationClient.send({
          eventType: 'community.donation_recorded',
          organizationId: membership.organization_id,
          recipientId: membership.user_id,
          title: 'Donation received — thank you!',
          body: `Your donation of ₹${saved.amount} has been recorded. Receipt: ${saved.receipt_number}.`,
        });
      }
    }

    return saved;
  }

  async findMine(user: RequestUser): Promise<(Donation & { event_id: string; event_name: string })[]> {
    const membership = await this.membershipResolver.resolve(user);
    const { entities, raw } = await this.donationRepo
      .createQueryBuilder('d')
      .innerJoin(Participation, 'p', 'p.id = d.participation_id')
      .innerJoin(Event, 'e', 'e.id = p.event_id')
      .addSelect(['p.event_id AS event_id', 'e.name AS event_name'])
      .where('p.membership_id = :membershipId', { membershipId: membership.id })
      .orderBy('d.createdAt', 'DESC')
      .getRawAndEntities();

    return entities.map((donation, i) => ({
      ...donation,
      event_id: raw[i].event_id,
      event_name: raw[i].event_name,
    }));
  }

  async findForEvent(eventId: string, user: RequestUser): Promise<Donation[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    return this.donationRepo
      .createQueryBuilder('d')
      .innerJoin(Participation, 'p', 'p.id = d.participation_id')
      .where('p.event_id = :eventId', { eventId })
      .orderBy('d.createdAt', 'DESC')
      .getMany();
  }
}
