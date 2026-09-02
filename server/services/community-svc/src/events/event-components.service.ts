import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { EventDay } from './entities/event-day.entity';
import { EventComponent } from './entities/event-component.entity';
import { CreateEventComponentDto, UpdateEventComponentDto } from './dto/event-component.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';

@Injectable()
export class EventComponentsService {
  constructor(
    @InjectRepository(EventDay) private readonly eventDayRepo: Repository<EventDay>,
    @InjectRepository(EventComponent) private readonly componentRepo: Repository<EventComponent>,
  ) {}

  private async loadParentDay(dayId: string, user: RequestUser): Promise<EventDay> {
    const day = await this.eventDayRepo.findOne({ where: { id: dayId }, relations: ['event'] });
    if (!day || !day.event) {
      throw new ApiError('Event day not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(day.event.organization_id, user);
    return day;
  }

  private async loadComponent(componentId: string, user: RequestUser): Promise<EventComponent> {
    const component = await this.componentRepo.findOne({ where: { id: componentId } });
    if (!component) {
      throw new ApiError('Component not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(component.organization_id, user);
    return component;
  }

  /**
   * The day's registration_mode ('join' | 'participate' | 'both') is a hard
   * constraint, not a UI hint — this is the one place it's actually
   * enforced, so it holds regardless of what the client sends or which
   * screen the request came from.
   *
   * Returns the registration_enabled/participation_enabled pair the
   * component should be saved with: whatever the caller explicitly asked
   * for, defaulted sensibly when omitted, then validated against what the
   * day allows. Throws a clear 409 rather than silently clamping a value
   * the caller explicitly requested — silently dropping an explicit choice
   * would be confusing to debug later ("I checked Participate, why didn't
   * it save?"); a defaulted, unrequested value is fine to infer quietly.
   */
  private resolveRegistrationFlags(
    day: EventDay,
    requested: { registration_enabled?: boolean; participation_enabled?: boolean },
  ): { registration_enabled: boolean; participation_enabled: boolean } {
    const mode = day.registration_mode;
    const joinAllowed = mode !== 'participate';
    const participateAllowed = mode !== 'join';

    // Only fall back to a default when the caller didn't specify a value at
    // all — an explicit `false` from the client must stay `false`.
    const registrationEnabled = requested.registration_enabled ?? (mode === 'participate' ? false : true);
    const participationEnabled = requested.participation_enabled ?? mode === 'participate';

    if (registrationEnabled && !joinAllowed) {
      throw new ApiError(
        `This day only allows "Participate" registration — "Join" isn't available for activities under it`,
        409,
        'REGISTRATION_MODE_NOT_ALLOWED',
      );
    }
    if (participationEnabled && !participateAllowed) {
      throw new ApiError(
        `This day only allows "Join" registration — "Participate" isn't available for activities under it`,
        409,
        'REGISTRATION_MODE_NOT_ALLOWED',
      );
    }

    return { registration_enabled: registrationEnabled, participation_enabled: participationEnabled };
  }

  async create(dayId: string, user: RequestUser, dto: CreateEventComponentDto): Promise<EventComponent> {
    const day = await this.loadParentDay(dayId, user);
    const { registration_enabled, participation_enabled } = this.resolveRegistrationFlags(day, {
      registration_enabled: dto.registration_enabled,
      participation_enabled: dto.participation_enabled,
    });

    const component = this.componentRepo.create({
      event_day_id: dayId,
      organization_id: day.event!.organization_id,
      name: dto.name,
      description: dto.description,
      component_type: (dto.component_type as EventComponent['component_type']) ?? 'activity',
      start_time: dto.start_time,
      end_time: dto.end_time,
      requires_booking: dto.requires_booking ?? false,
      location_resource: dto.location_resource as EventComponent['location_resource'],
      capacity: dto.capacity,
      audience: dto.audience as EventComponent['audience'],
      registration_enabled,
      participation_enabled,
      donation_enabled: dto.donation_enabled ?? false,
      sponsorship_enabled: dto.sponsorship_enabled ?? false,
      volunteer_enabled: dto.volunteer_enabled ?? false,
      price_internal: dto.price_internal,
      price_external: dto.price_external,
      status: 'draft',
      sequence: dto.sequence ?? 1,
    });
    return this.componentRepo.save(component);
  }

  async update(componentId: string, user: RequestUser, dto: UpdateEventComponentDto): Promise<EventComponent> {
    const component = await this.loadComponent(componentId, user);

    // Only re-validate against the day's mode when this update actually
    // touches registration_enabled/participation_enabled — avoids an extra
    // query on every unrelated edit (renaming, changing capacity, etc.).
    if (dto.registration_enabled !== undefined || dto.participation_enabled !== undefined) {
      const day = await this.eventDayRepo.findOne({ where: { id: component.event_day_id } });
      if (!day) {
        throw new ApiError('Event day not found', 404, 'NOT_FOUND');
      }
      const { registration_enabled, participation_enabled } = this.resolveRegistrationFlags(day, {
        registration_enabled: dto.registration_enabled ?? component.registration_enabled,
        participation_enabled: dto.participation_enabled ?? component.participation_enabled,
      });
      dto = { ...dto, registration_enabled, participation_enabled };
    }

    Object.assign(component, dto);
    return this.componentRepo.save(component);
  }

  async remove(componentId: string, user: RequestUser): Promise<void> {
    const component = await this.loadComponent(componentId, user);
    await this.componentRepo.remove(component);
  }
}
