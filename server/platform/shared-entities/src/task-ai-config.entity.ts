import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('task_ai_config')
@Unique(['organization_id', 'task_type'])
export class TaskAIConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int4', nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column()
  task_type!: string;

  @Column({ default: true })
  inspection_enabled!: boolean;

  @Column({ default: true })
  detection_enabled!: boolean;

  @Column({ default: true })
  difference_enabled!: boolean;

  @Column({ type: 'int4', nullable: true })
  default_expected_completion_minutes?: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
