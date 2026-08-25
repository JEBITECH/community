import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type ParticipationType = 'join' | 'book' | 'donate' | 'sponsor' | 'volunteer';
export type ParticipationStatus = 'active' | 'cancelled' | 'attended' | 'no_show';

/**
 * Header row for "who did what, against which event/component" — one row per
 * participation, with strongly-typed detail rows (Booking, and later
 * Donation/Sponsorship/VolunteerAssignment) hanging off it via participation_id.
 * This keeps cross-cutting queries (My Activity, admin dashboards) to a single
 * indexed table while each type's real columns stay strongly typed.
 *
 * Double-registration is prevented at the DB level via two partial unique
 * indexes (see the CreateParticipationTables migration) rather than a single
 * UNIQUE constraint, because Postgres treats NULL != NULL — a plain
 * UNIQUE(membership_id, event_component_id, type) would silently let a member
 * join the same *event* (component_id NULL) more than once.
 */
@Entity('participation')
@Index(['membership_id', 'event_id'])
@Index(['organization_id', 'type', 'status'])
export class Participation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid' })
  event_id!: string;

  @Column({ type: 'uuid', nullable: true })
  event_component_id?: string | null;

  @Column({ type: 'uuid' })
  membership_id!: string;

  @Column({ type: 'varchar' })
  type!: ParticipationType;

  @Column({ type: 'varchar', default: 'active' })
  status!: ParticipationStatus;

  @Column({ type: 'uuid', default: () => 'gen_random_uuid()' })
  qr_code_token!: string;

  @Column({ type: 'timestamptz', nullable: true })
  attended_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
