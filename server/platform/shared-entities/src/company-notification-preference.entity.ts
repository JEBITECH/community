import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('notification_company_preferences')
@Index(['organizationId'], { unique: true })
export class CompanyNotificationPreferenceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organization_id', type: 'int4' })
  organizationId!: number;

  @OneToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ type: 'jsonb', default: {} })
  channels!: {
    allowEmail?: boolean;
    allowSms?: boolean;
    allowPush?: boolean;
    allowWhatsapp?: boolean;
    allowInApp?: boolean;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
