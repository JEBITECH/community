import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

const normalizeTemplateVariables = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).filter((key) => key.trim().length > 0);
  }

  return [];
};

@Entity('notification_templates')
@Index(['eventType', 'channel', 'language', 'organizationId', 'version'], {
  unique: true,
})
@Index(['eventType', 'channel', 'language', 'isActive'])
export class NotificationTemplateEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType!: string;

  @Column({ type: 'varchar' })
  channel!: string;

  @Column({ type: 'varchar', default: 'en' })
  language!: string;

  @Column({ name: 'organization_id', type: 'int4', nullable: true })
  organizationId?: number | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @Column({ type: 'varchar', length: 30, nullable: true, default: 'transactional' })
  category?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type?: string | null;

  @Column({ name: 'html_content', type: 'text', nullable: true })
  htmlContent?: string | null;

  @Column({ name: 'text_content', type: 'text', nullable: true })
  textContent?: string | null;

  @Column({ name: 'json_content', type: 'text', nullable: true })
  jsonContent?: string | null;

  @Column({
    name: 'variables',
    type: 'jsonb',
    nullable: false,
    default: () => "'[]'::jsonb",
    transformer: {
      to: normalizeTemplateVariables,
      from: normalizeTemplateVariables,
    },
  })
  variables!: string[];

  @Column({ type: 'varchar', nullable: true })
  preheader?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, default: 'draft' })
  status?: string | null;

  @Column({ name: 'is_default', type: 'boolean', nullable: false, default: false })
  isDefault!: boolean;

  @Column({ type: 'text' })
  template!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  subject?: string | null;

  @Column({ name: 'fallback_template_id', type: 'int', nullable: true })
  fallbackTemplateId?: number | null;

  @ManyToOne(() => NotificationTemplateEntity, (template) => template.fallbackFor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fallback_template_id' })
  fallbackTemplate?: NotificationTemplateEntity | null;

  @OneToMany(() => NotificationTemplateEntity, (template) => template.fallbackTemplate)
  fallbackFor?: NotificationTemplateEntity[];

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy?: string | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
