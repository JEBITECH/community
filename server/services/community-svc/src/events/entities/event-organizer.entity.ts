import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';

export type OrganizerRoleLabel = 'lead' | 'co_organizer';

@Entity('event_organizer')
@Unique(['event_id', 'membership_id'])
export class EventOrganizer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  event_id!: string;

  @ManyToOne(() => Event, (event) => event.organizers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @Column({ type: 'uuid' })
  membership_id!: string;

  @Column({ type: 'varchar', default: 'co_organizer' })
  role_label!: OrganizerRoleLabel;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
