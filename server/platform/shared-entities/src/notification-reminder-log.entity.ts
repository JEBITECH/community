import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification_reminder_logs')
@Index(['taskId', 'eventType', 'recipientId'])
export class NotificationReminderLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'task_id', type: 'bigint' })
  taskId!: number;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType!: string;

  @Column({ name: 'recipient_id', type: 'varchar' })
  recipientId!: string;

  @Column({ name: 'sent_at', type: 'timestamptz' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
