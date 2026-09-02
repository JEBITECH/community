import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Event, EventAudience } from './event.entity';
import { EventComponent } from './event-component.entity';

export type DayRegistrationMode = 'join' | 'participate' | 'both';

@Entity('event_day')
@Index(['event_id', 'day_number'])
export class EventDay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  event_id!: string;

  @ManyToOne(() => Event, (event) => event.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @Column({ type: 'int' })
  day_number!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  sequence!: number;

  @Column({ type: 'varchar', nullable: true })
  audience?: EventAudience;

  /** Hard constraint on every activity added under this day — 'join' allows
   * only the Join button, 'participate' allows only Participate, 'both'
   * (default) leaves each activity free to enable either/both individually.
   * Enforced server-side in EventComponentsService, not just hidden client
   * checkboxes — see the AddDayRegistrationMode migration. */
  @Column({ type: 'varchar', default: 'both' })
  registration_mode!: DayRegistrationMode;

  @OneToMany(() => EventComponent, (component) => component.eventDay, { cascade: true })
  components?: EventComponent[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
