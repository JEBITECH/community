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

@Entity('notification_role_preferences')
@Index(['role', 'organizationId'], { unique: true })
export class RoleNotificationPreferenceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  role!: string;

  @Column({ name: 'role_id', type: 'int4', nullable: true })
  roleId?: number | null;

  @Column({ name: 'organization_id', type: 'int4', nullable: true })
  organizationId?: number | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @Column({ name: 'event_preferences', type: 'jsonb', default: {} })
  eventPreferences!: Record<string, boolean>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
