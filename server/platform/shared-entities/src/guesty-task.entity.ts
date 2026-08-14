
import { Task } from './task.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('guesty_task')
export class GuestyTask {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  guesty_id?: string;

  @Column({ nullable: true })
  accountId?: string;

  @Column({ type: 'jsonb', nullable: true })
  afterEffects?: any[];

  @Column({ type: 'jsonb', nullable: true })
  assigneeGroup?: any[];

  @Column({ type: 'jsonb', nullable: true })
  attachments?: any[];

  @Column({ nullable: true })
  canStartAfter?: string;

  @Column({ type: 'jsonb', nullable: true })
  checklist?: any[];

  @Column({ type: 'jsonb', nullable: true })
  checklistAggregated?: any[];

  @Column({ type: 'jsonb', nullable: true })
  checklistFinished?: any[];

  @Column({ type: 'jsonb', nullable: true })
  comments?: any[];

  @Column({ type: 'jsonb', nullable: true })
  pendingExpenses?: any[];

  @Column({ type: 'jsonb', nullable: true })
  postedExpenses?: any[];

  @Column({ nullable: true })
  createdAt?: string;

  @Column({ nullable: true })
  dateForSort?: string;

  @Column({ nullable: true })
  listingId?: string;

  @Column({ nullable: true })
  reservationId?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  editedFields?: any[];

  @Column({ type: 'jsonb', nullable: true })
  expenses?: any[];

  @Column({ type: 'jsonb', nullable: true })
  listing?: any;

  @Column({ type: 'jsonb', nullable: true })
  log?: any[];

  @Column({ nullable: true })
  mustFinishBefore?: string;

  @Column({ nullable: true })
  origin?: string;

  @Column({ nullable: true })
  priority?: number;

  @Column({ type: 'jsonb', nullable: true })
  reservation?: any;

  @Column({ type: 'jsonb', nullable: true })
  shortTaskId?: any[];

  @Column({ nullable: true })
  startTime?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ type: 'jsonb', nullable: true })
  tags?: any[];

  @Column({ type: 'jsonb', nullable: true })
  scheduledFor?: any[];

  @Column({ nullable: true })
  taskTitle?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  assigneeId?: string;

  @Column({ nullable: true })
  updatedAt?: string;

  @Column({ nullable: true })
  completedAt?: string;

  @Column({ nullable: true })
  enumeratedStatus?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @OneToOne(() => Task, (task) => task.guesty_task, { nullable: true })
  task?: Task;
}
