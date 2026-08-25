import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from '../participations/entities/participation.entity';
import { SponsorshipNeed } from './entities/sponsorship-need.entity';
import { Sponsorship } from './entities/sponsorship.entity';
import { CreateSponsorshipNeedDto, CreateSponsorshipDto } from './dto/sponsorship.dto';
import { CreatePublicSponsorshipDto } from './dto/create-public-sponsorship.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { assertGuestAudienceAllowed } from '../common/helpers/audience.helper';
import { assertValidPaymentTransition, generateReceiptNumber } from '../common/helpers/payment-state.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { GuestMembershipResolverService } from '../common/services/guest-membership-resolver.service';
import { NotificationClientService } from '../common/services/notification-client.service';

@Injectable()
export class SponsorshipsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly membershipResolver: MembershipResolverService,
    private readonly guestMembershipResolver: GuestMembershipResolverService,
    private readonly notificationClient: NotificationClientService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventComponent) private readonly componentRepo: Repository<EventComponent>,
    @InjectRepository(Participation) private readonly participationRepo: Repository<Participation>,
    @InjectRepository(SponsorshipNeed) private readonly needRepo: Repository<SponsorshipNeed>,
    @InjectRepository(Sponsorship) private readonly sponsorshipRepo: Repository<Sponsorship>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
  ) {}

  async createNeed(user: RequestUser, dto: CreateSponsorshipNeedDto): Promise<SponsorshipNeed> {
    const event = await this.eventRepo.findOne({ where: { id: dto.event_id } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    if (dto.event_component_id) {
      const component = await this.componentRepo.findOne({ where: { id: dto.event_component_id } });
      if (!component) {
        throw new ApiError('Component not found', 404, 'NOT_FOUND');
      }
      assertTenantMatch(component.organization_id, user);
    }

    const need = this.needRepo.create({
      organization_id: event.organization_id,
      event_id: event.id,
      event_component_id: dto.event_component_id,
      title: dto.title,
      description: dto.description,
      target_amount: dto.target_amount,
      amount_raised: 0,
      status: 'open',
    });
    return this.needRepo.save(need);
  }

  async findNeedsForEvent(eventId: string, user: RequestUser): Promise<SponsorshipNeed[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);
    return this.needRepo.find({ where: { event_id: eventId }, order: { createdAt: 'ASC' } });
  }

  async findNeedsForPublicEvent(eventId: string): Promise<SponsorshipNeed[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'published' || !['public', 'internal_external'].includes(event.audience)) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    return this.needRepo.find({ where: { event_id: eventId, status: 'open' }, order: { createdAt: 'ASC' } });
  }

  async create(user: RequestUser, dto: CreateSponsorshipDto): Promise<Sponsorship> {
    const membership = await this.membershipResolver.resolve(user);
    const need = await this.loadOpenNeed(dto.sponsorship_need_id);
    assertTenantMatch(need.organization_id, user);
    return this.createForMembership(membership, need, dto.amount_pledged);
  }

  async createGuest(dto: CreatePublicSponsorshipDto): Promise<Sponsorship> {
    const need = await this.loadOpenNeed(dto.sponsorship_need_id);
    const event = await this.eventRepo.findOne({ where: { id: need.event_id } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    let audience = event.audience;
    if (need.event_component_id) {
      const component = await this.componentRepo.findOne({ where: { id: need.event_component_id } });
      audience = component?.audience ?? audience;
    }
    assertGuestAudienceAllowed(audience);
    const membership = await this.guestMembershipResolver.resolve(need.organization_id, dto.guest);
    return this.createForMembership(membership, need, dto.amount_pledged);
  }

  private async loadOpenNeed(needId: string): Promise<SponsorshipNeed> {
    const need = await this.needRepo.findOne({ where: { id: needId } });
    if (!need) {
      throw new ApiError('Sponsorship opportunity not found', 404, 'NOT_FOUND');
    }
    if (need.status !== 'open') {
      throw new ApiError('This sponsorship opportunity is no longer open', 409, 'SPONSORSHIP_NEED_CLOSED');
    }
    return need;
  }

  private async createForMembership(membership: Membership, need: SponsorshipNeed, amountPledged: number): Promise<Sponsorship> {
    return this.dataSource.transaction(async (manager) => {
      const participation = await manager.save(
        manager.create(Participation, {
          organization_id: need.organization_id,
          event_id: need.event_id,
          event_component_id: need.event_component_id ?? null,
          membership_id: membership.id,
          type: 'sponsor',
          status: 'active',
        }),
      );

      return manager.save(
        manager.create(Sponsorship, {
          participation_id: participation.id,
          sponsorship_need_id: need.id,
          amount_pledged: amountPledged,
          payment_status: 'pending',
        }),
      );
    });
  }

  private async loadWithTenantCheck(id: string, user: RequestUser): Promise<{ sponsorship: Sponsorship; participation: Participation }> {
    const sponsorship = await this.sponsorshipRepo.findOne({ where: { id } });
    if (!sponsorship) {
      throw new ApiError('Sponsorship not found', 404, 'NOT_FOUND');
    }
    const participation = await this.participationRepo.findOne({ where: { id: sponsorship.participation_id } });
    if (!participation) {
      throw new ApiError('Sponsorship not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(participation.organization_id, user);
    return { sponsorship, participation };
  }

  async recordPayment(id: string, user: RequestUser, dto: RecordPaymentDto): Promise<Sponsorship> {
    const { sponsorship, participation } = await this.loadWithTenantCheck(id, user);
    assertValidPaymentTransition(sponsorship.payment_status, dto.payment_status);

    const saved = await this.dataSource.transaction(async (manager) => {
      sponsorship.payment_status = dto.payment_status;
      sponsorship.payment_method = dto.payment_method as Sponsorship['payment_method'];
      sponsorship.recorded_by_user_id = user.id;
      sponsorship.recorded_at = new Date();
      if (dto.payment_status === 'recorded' && !sponsorship.receipt_number) {
        sponsorship.receipt_number = generateReceiptNumber('SPN');
      }
      const saved = await manager.save(sponsorship);

      if (dto.payment_status === 'recorded') {
        // Lock the need row so two concurrently-recorded pledges can't race
        // on the running total.
        await manager.query('SELECT id FROM sponsorship_need WHERE id = $1 FOR UPDATE', [sponsorship.sponsorship_need_id]);
        const need = await manager.findOne(SponsorshipNeed, { where: { id: sponsorship.sponsorship_need_id } });
        if (need) {
          need.amount_raised = Number(need.amount_raised) + Number(sponsorship.amount_pledged);
          if (need.amount_raised >= Number(need.target_amount) && need.status === 'open') {
            need.status = 'fulfilled';
          }
          await manager.save(need);
        }
      }

      return saved;
    });

    if (dto.payment_status === 'recorded') {
      const membership = await this.membershipRepo.findOne({ where: { id: participation.membership_id } });
      if (membership) {
        this.notificationClient.send({
          eventType: 'community.sponsorship_recorded',
          organizationId: membership.organization_id,
          recipientId: membership.user_id,
          title: 'Sponsorship pledge received — thank you!',
          body: `Your sponsorship pledge of ₹${saved.amount_pledged} has been recorded. Receipt: ${saved.receipt_number}.`,
        });
      }
    }

    return saved;
  }

  async findMine(user: RequestUser): Promise<(Sponsorship & { event_id: string; event_name: string })[]> {
    const membership = await this.membershipResolver.resolve(user);
    const { entities, raw } = await this.sponsorshipRepo
      .createQueryBuilder('s')
      .innerJoin(Participation, 'p', 'p.id = s.participation_id')
      .innerJoin(Event, 'e', 'e.id = p.event_id')
      .addSelect(['p.event_id AS event_id', 'e.name AS event_name'])
      .where('p.membership_id = :membershipId', { membershipId: membership.id })
      .orderBy('s.createdAt', 'DESC')
      .getRawAndEntities();

    return entities.map((sponsorship, i) => ({
      ...sponsorship,
      event_id: raw[i].event_id,
      event_name: raw[i].event_name,
    }));
  }

  async findForEvent(eventId: string, user: RequestUser): Promise<Sponsorship[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    return this.sponsorshipRepo
      .createQueryBuilder('s')
      .innerJoin(Participation, 'p', 'p.id = s.participation_id')
      .where('p.event_id = :eventId', { eventId })
      .orderBy('s.createdAt', 'DESC')
      .getMany();
  }
}
