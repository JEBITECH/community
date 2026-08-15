import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EventDay } from './event-day.entity';
import { EventAudience } from './event.entity';

export type ComponentType = 'activity' | 'seva' | 'donation_drive' | 'session';
export type LocationResource = 'conference_room' | 'lab' | 'terrace' | 'open_space' | 'club';
export type ComponentStatus = 'draft' | 'published' | 'cancelled' | 'completed';

@Entity('event_component')
@Index(['event_day_id'])
export class EventComponent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  event_day_id!: string;

  @ManyToOne(() => EventDay, (day) => day.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_day_id' })
  eventDay?: EventDay;

  /**
   * Denormalized for cheap tenant-isolation checks (TenantGuard) without a
   * join through event_day -> event on every request.
   */
  @Column({ type: 'int' })
  @Index()
  organization_id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: 'activity' })
  component_type!: ComponentType;

  @Column({ type: 'time', nullable: true })
  start_time?: string;

  @Column({ type: 'time', nullable: true })
  end_time?: string;

  @Column({ type: 'boolean', default: false })
  requires_booking!: boolean;

  @Column({ type: 'varchar', nullable: true })
  location_resource?: LocationResource;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ type: 'varchar', nullable: true })
  audience?: EventAudience;

  @Column({ type: 'boolean', default: true })
  registration_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  donation_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  sponsorship_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  volunteer_enabled!: boolean;

  @Column({ type: 'decimal', nullable: true })
  price_internal?: number;

  @Column({ type: 'decimal', nullable: true })
  price_external?: number;

  @Column({ type: 'varchar', default: 'draft' })
  status!: ComponentStatus;

  @Column({ type: 'int', default: 1 })
  sequence!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
