
import { Task } from './task.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Cost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  total_cost?: number;

  @Column({ nullable: true })
  currency?: string;

  @OneToOne(() => Task, (task) => task.cost, { nullable: true })
  @JoinColumn()
  task?: Task;
}
