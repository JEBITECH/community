import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

export enum ExecutorProfileStatus {
  Active = 'active',
  Inactive = 'inactive',
  OnLeave = 'on_leave',
}

@Entity('executors')
@Unique(['user_id'])
export class ExecutorProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int4', nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'varchar', nullable: true })
  full_name?: string | null;

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'::jsonb" })
  skills!: string[];

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'::jsonb" })
  specialization!: string[];

  @Column({ type: 'time', nullable: true })
  working_hours_start?: string | null;

  @Column({ type: 'time', nullable: true })
  working_hours_end?: string | null;

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'::jsonb" })
  working_days!: string[];

  @Column({ type: 'boolean', nullable: false, default: true })
  is_available!: boolean;

  @Column({ type: 'float', nullable: true })
  performance_score?: number | null;

  @Column({ type: 'double precision', nullable: true })
  current_live_latitude?: number | null;

  @Column({ type: 'double precision', nullable: true })
  current_live_longitude?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  live_location_updated_at?: Date | null;

  @Column({ type: 'int4', nullable: false, default: 5 })
  live_location_interval_minutes!: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: ExecutorProfileStatus.Active,
  })
  status!: ExecutorProfileStatus;

  @Column({ type: 'uuid', nullable: true })
  created_by_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by_id?: string | null;

  @OneToMany(() => ExecutorLocationLog, (log) => log.executor)
  location_logs?: ExecutorLocationLog[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

@Entity('executor_location_logs')
export class ExecutorLocationLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int4', nullable: false })
  executor_id!: number;

  @ManyToOne(() => ExecutorProfile, (executor) => executor.location_logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'executor_id' })
  executor!: ExecutorProfile;

  @Column({ type: 'uuid', nullable: false })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int4', nullable: false })
  organization_id!: number;

  @Column({ type: 'double precision', nullable: false })
  latitude!: number;

  @Column({ type: 'double precision', nullable: false })
  longitude!: number;

  @Column({ type: 'timestamptz', nullable: false })
  captured_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
