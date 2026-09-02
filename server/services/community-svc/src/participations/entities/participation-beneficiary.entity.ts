import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Participation } from './participation.entity';

export type BeneficiaryRelation = 'self' | 'family' | 'other';

/**
 * One row per person a "Join"/"Participate"/"Book" registration is actually
 * for. A "single" participation has exactly one row; a "multiple" one has
 * several (e.g. self + 2 family members + 1 guest). `membership_id` is set
 * whenever the beneficiary could be resolved to an existing member of the
 * same organization (always true for 'self'; optional, looked-up-by-ID for
 * 'family'/'other') so admin reports can tell "who" beyond just a typed name.
 */
@Entity('participation_beneficiary')
@Index(['participation_id'])
export class ParticipationBeneficiary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  participation_id!: string;

  @ManyToOne(() => Participation, (participation) => participation.beneficiaries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participation_id' })
  participation?: Participation;

  @Column({ type: 'varchar' })
  relation_type!: BeneficiaryRelation;

  @Column({ type: 'varchar' })
  full_name!: string;

  /** Set when this beneficiary was matched to an existing membership in the
   * org (self is always matched; family/other only when the registrant
   * supplied a membership ID that resolved). Null for a family member/guest
   * who isn't a member themselves — full_name is then the only record. */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  membership_id?: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}