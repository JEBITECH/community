import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type VolunteerApprovalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/**
 * 1:1 with a Participation row where type='volunteer'. membership_id is
 * denormalized from the participation (rather than joined) so a DB-level
 * active pending/approved assignments are kept unique by a partial database
 * index. Rejected/withdrawn rows remain as audit history and do not block a
 * future sign-up for the same role.
 */
@Entity('volunteer_assignment')
export class VolunteerAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  participation_id!: string;

  @Column({ type: 'uuid' })
  volunteer_role_id!: string;

  @Column({ type: 'uuid' })
  membership_id!: string;

  @Column({ type: 'varchar', default: 'pending' })
  approval_status!: VolunteerApprovalStatus;

  @Column({ type: 'uuid', nullable: true })
  approved_by_user_id?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null;

  @Column({ type: 'boolean', default: false })
  attendance_marked!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
