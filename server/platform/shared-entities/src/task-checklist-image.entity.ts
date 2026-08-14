
import { Task } from './task.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TaskChecklistImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'jsonb', nullable: true })
  checklist_images?: [];

  @OneToOne(() => Task, (task) => task.checklist_image, { nullable: true })
  @JoinColumn()
  task?: Task;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
