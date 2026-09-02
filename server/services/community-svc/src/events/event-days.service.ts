import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Event } from './entities/event.entity';
import { EventDay } from './entities/event-day.entity';
import { CreateEventDayDto, UpdateEventDayDto } from './dto/event-day.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';

@Injectable()
export class EventDaysService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventDay) private readonly eventDayRepo: Repository<EventDay>,
  ) {}

  private async loadParentEvent(eventId: string, user: RequestUser): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);
    return event;
  }

  private async loadDay(dayId: string, user: RequestUser): Promise<EventDay> {
    const day = await this.eventDayRepo.findOne({ where: { id: dayId }, relations: ['event'] });
    if (!day || !day.event) {
      throw new ApiError('Event day not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(day.event.organization_id, user);
    return day;
  }

  async create(eventId: string, user: RequestUser, dto: CreateEventDayDto): Promise<EventDay> {
    const event = await this.loadParentEvent(eventId, user);
    if (!event.is_multi_day) {
      throw new ApiError('Only multi-day events accept additional days', 409, 'NOT_MULTI_DAY');
    }

    const existing = await this.eventDayRepo.findOne({ where: { event_id: eventId, day_number: dto.day_number } });
    if (existing) {
      throw new ApiError(`Day ${dto.day_number} already exists for this event`, 409, 'DUPLICATE_DAY_NUMBER');
    }

    const day = this.eventDayRepo.create({
      event_id: eventId,
      day_number: dto.day_number,
      date: dto.date,
      title: dto.title,
      description: dto.description,
      sequence: dto.sequence ?? dto.day_number,
      audience: dto.audience as EventDay['audience'],
      registration_mode: (dto.registration_mode as EventDay['registration_mode']) ?? 'both',
    });
    return this.eventDayRepo.save(day);
  }

  async update(dayId: string, user: RequestUser, dto: UpdateEventDayDto): Promise<EventDay> {
    const day = await this.loadDay(dayId, user);
    Object.assign(day, dto, { audience: (dto.audience as EventDay['audience']) ?? day.audience });
    return this.eventDayRepo.save(day);
  }

  async remove(dayId: string, user: RequestUser): Promise<void> {
    const day = await this.loadDay(dayId, user);
    await this.eventDayRepo.remove(day);
  }
}
