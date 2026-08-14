
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Task } from './task.entity';

@Entity()
export class AdditionalCost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cost_type?: string;

  @Column()
  cost_name?: string;

  @Column({ nullable: true })
  cost_desc?: string;

  @Column({ nullable: true })
  supplier_name?: string;

  @Column({ nullable: true, type: 'float' })
  quantity?: number;

  @Column({ nullable: true })
  measuring_unit?: string;

  @Column({ type: 'float' })
  amount?: number;

  @Column({ nullable: true })
  bill_to?: string;

  @Column({ type: 'timestamptz', nullable: true })
  billing_date?: Date;

  @Column({ nullable: true })
  charge_type?: string;

  @Column({ nullable: true, type: 'float' })
  charge_amount?: number;

  @Column({ nullable: true, type: 'float' })
  total_amount?: number;

  @Column()
  task_id?: number;

  @ManyToOne(() => Task, (task) => task.additional_costs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  // 0 means cost is not settled and 1 means cost is settled
  @Column({ default: 0 })
  is_settled?: number;
}
