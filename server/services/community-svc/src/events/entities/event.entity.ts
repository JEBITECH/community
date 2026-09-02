import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EventDay } from './event-day.entity';
import { EventOrganizer } from './event-organizer.entity';

export type EventType =
  | 'community_program'
  | 'festival'
  | 'educational_program'
  | 'workshop'
  | 'sports'
  | 'cultural'
  | 'meeting'
  | 'fundraising';

export type EventAudience = 'internal' | 'internal_external' | 'public' | 'invite_only';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

@Entity('event')
@Index(['organization_id', 'status'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  @Index()
  organization_id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar' })
  event_type!: EventType;

  @Column({ type: 'boolean', default: false })
  is_multi_day!: boolean;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ type: 'date' })
  end_date!: string;

  @Column({ type: 'varchar', nullable: true })
  venue?: string;

  /** IANA zone (e.g. "Asia/Kolkata") every start/end time on this event and
   * its days/components/bookings is authored and displayed in. */
  @Column({ type: 'varchar', default: 'Asia/Kolkata' })
  timezone!: string;

  @Column({ type: 'text', nullable: true })
  cover_image_url?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ type: 'varchar', default: 'internal' })
  audience!: EventAudience;

  @Column({ type: 'boolean', default: true })
  registration_required!: boolean;

  @Column({ type: 'boolean', default: false })
  booking_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  donation_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  volunteer_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  sponsorship_enabled!: boolean;

  @Column({ type: 'varchar', default: 'draft' })
  status!: EventStatus;

  @Column({ type: 'uuid' })
  created_by_user_id!: string;

  @Column({ type: 'timestamptz', nullable: true })
  published_at?: Date;

  @OneToMany(() => EventDay, (day) => day.event, { cascade: true })
  days?: EventDay[];

  @OneToMany(() => EventOrganizer, (organizer) => organizer.event, { cascade: true })
  organizers?: EventOrganizer[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
