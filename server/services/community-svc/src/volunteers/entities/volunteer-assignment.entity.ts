import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

export type VolunteerApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * 1:1 with a Participation row where type='volunteer'. membership_id is
 * denormalized from the participation (rather than joined) so a DB-level
 * @Unique(['membership_id','volunteer_role_id']) can catch double sign-up
 * races the same way Participation's partial unique indexes do — a role
 * isn't an EventComponent, so Participation's own uniqueness rules don't
 * cover it.
 */
@Entity('volunteer_assignment')
@Unique('UQ_volunteer_assignment_membership_role', ['membership_id', 'volunteer_role_id'])
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
