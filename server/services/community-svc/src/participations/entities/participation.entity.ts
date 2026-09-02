import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ParticipationBeneficiary } from './participation-beneficiary.entity';

export type ParticipationType = 'join' | 'book' | 'donate' | 'sponsor' | 'volunteer';
export type ParticipationStatus = 'active' | 'cancelled' | 'attended' | 'no_show';
export type ParticipationMode = 'single' | 'multiple';
export type RegistrationMethod = 'join' | 'participate' | 'book';

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

  /** How a member registered for this row. `join` is the one-tap RSVP;
   * `participate` is the detailed self/family/other flow. Both intentionally
   * share type='join' so legacy consumers and capacity/reporting remain stable,
   * while this field makes the user's chosen path explicit. */
  @Column({ type: 'varchar', default: 'join' })
  registration_method!: RegistrationMethod;

  @Column({ type: 'varchar', default: 'active' })
  status!: ParticipationStatus;

  /** 'single' = this covers one person (the member, or the one beneficiary
   * they registered on behalf of). 'multiple' = the member registered
   * several people (self + family + others) under one participation row. */
  @Column({ type: 'varchar', default: 'single' })
  mode!: ParticipationMode;

  /** How many people this participation covers — equal to
   * beneficiaries.length whenever beneficiary detail was captured. This is
   * what capacity checks sum, so a "multiple" participation correctly
   * consumes more than one seat. */
  @Column({ type: 'int', default: 1 })
  party_size!: number;

  @Column({ type: 'uuid', default: () => 'gen_random_uuid()' })
  qr_code_token!: string;

  @Column({ type: 'timestamptz', nullable: true })
  attended_at?: Date | null;

  @OneToMany(() => ParticipationBeneficiary, (beneficiary) => beneficiary.participation, { cascade: true })
  beneficiaries?: ParticipationBeneficiary[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
