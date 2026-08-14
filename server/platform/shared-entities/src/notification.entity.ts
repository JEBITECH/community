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
import { NormalizedReservation } from './normalized-reservation';
import { Organization } from './organization.entity';
import { Task } from './task.entity';
import { User } from './user.entity';
import { NotificationDeliveryLogEntity } from './notification-delivery-log.entity';
import { NotificationTemplateEntity } from './notification-template.entity';

@Entity('notifications')
@Index(['eventType', 'recipientId'])
@Index(['status', 'channel'])
@Index(['organizationId', 'eventType'])
@Index(['taskId'])
@Index(['reservationId'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType!: string;

  @Column({ name: 'entity_type', type: 'varchar', nullable: true })
  entityType?: string | null;

  @Column({ name: 'entity_id', type: 'varchar', nullable: true })
  entityId?: string | null;

  @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
  tenantId?: string | null;

  @Column({ name: 'recipient_id', type: 'uuid', nullable: true })
  recipientId?: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'recipient_id' })
  recipient?: User | null;

  @Column({ type: 'varchar' })
  channel!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @Column({ name: 'organization_id', type: 'int4', nullable: true })
  organizationId?: number | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @Column({ name: 'task_id', type: 'int4', nullable: true })
  taskId?: number | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'task_id' })
  task?: Task | null;

  @Column({ name: 'reservation_id', type: 'int4', nullable: true })
  reservationId?: number | null;

  @ManyToOne(() => NormalizedReservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation?: NormalizedReservation | null;

  @Column({ name: 'template_id', type: 'int4', nullable: true })
  templateId?: number | null;

  @ManyToOne(() => NotificationTemplateEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template?: NotificationTemplateEntity | null;

  @Column({ name: 'source_service', type: 'varchar', nullable: true })
  sourceService?: string | null;

  @Column({ name: 'idempotency_key', type: 'varchar', nullable: true, unique: true })
  idempotencyKey?: string | null;

  @Column({ name: 'priority', type: 'int', nullable: true })
  priority?: number | null;

  @Column({ name: 'subject', type: 'varchar', nullable: true })
  subject?: string | null;

  @Column({ name: 'content', type: 'text', nullable: true })
  content?: string | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @OneToMany(() => NotificationDeliveryLogEntity, (log) => log.notification)
  deliveryLogs?: NotificationDeliveryLogEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
