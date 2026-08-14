import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('notification_user_preferences')
@Index(['userId', 'organizationId'], { unique: true })
export class UserNotificationPreferenceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'organization_id', type: 'int4', nullable: true })
  organizationId?: number | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @Column({ type: 'jsonb', default: {} })
  channels!: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    whatsapp?: boolean;
  };

  @Column({ name: 'quiet_hours_start', type: 'varchar', nullable: true })
  quietHoursStart?: string | null;

  @Column({ name: 'quiet_hours_end', type: 'varchar', nullable: true })
  quietHoursEnd?: string | null;

  @Column({ type: 'varchar', nullable: true })
  timezone?: string | null;

  @Column({ name: 'do_not_disturb', type: 'boolean', default: false })
  doNotDisturb!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
