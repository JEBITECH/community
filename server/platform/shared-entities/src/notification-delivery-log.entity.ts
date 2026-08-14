import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationEntity } from './notification.entity';

@Entity('notification_delivery_logs')
@Index(['notificationId'])
@Index(['provider', 'status'])
export class NotificationDeliveryLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId!: string;

  @ManyToOne(() => NotificationEntity, (notification) => notification.deliveryLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notification_id' })
  notification?: NotificationEntity;

  @Column({ type: 'varchar' })
  provider!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ name: 'attempt_number', type: 'int', default: 1 })
  attemptNumber!: number;

  @Column({ name: 'provider_message_id', type: 'varchar', nullable: true })
  providerMessageId?: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  response?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
