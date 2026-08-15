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

  async create(dayId: string, user: RequestUser, dto: CreateEventComponentDto): Promise<EventComponent> {
    const day = await this.loadParentDay(dayId, user);

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
      registration_enabled: dto.registration_enabled ?? true,
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
    Object.assign(component, dto);
    return this.componentRepo.save(component);
  }

  async remove(componentId: string, user: RequestUser): Promise<void> {
    const component = await this.loadComponent(componentId, user);
    await this.componentRepo.remove(component);
  }
}
