import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type VolunteerRoleStatus = 'open' | 'filled' | 'closed';

/** A seva/volunteer slot on an event or a specific component within it. */
@Entity('volunteer_role')
@Index(['event_id'])
export class VolunteerRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid' })
  event_id!: string;

  @Column({ type: 'uuid', nullable: true })
  event_component_id?: string | null;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'time', nullable: true })
  slot_start?: string;

  @Column({ type: 'time', nullable: true })
  slot_end?: string;

  @Column({ type: 'int' })
  headcount_needed!: number;

  /** Denormalized count of active (pending+approved) assignments, maintained
   * transactionally alongside VolunteerAssignment inserts/removals so slot
   * availability can be read without a join+count on every request. */
  @Column({ type: 'int', default: 0 })
  headcount_filled!: number;

  @Column({ type: 'varchar', default: 'open' })
  status!: VolunteerRoleStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
