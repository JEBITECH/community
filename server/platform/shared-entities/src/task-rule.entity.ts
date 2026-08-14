
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ConditionType } from './enums/condition.enum';
import { ExecutionMomentType } from './enums/executionMoment.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { RateUnit } from './enums/rate-unit.enum';
import { TaskType } from './enums/task-type.enum';
import { StayType } from './enums/stayType.enum';
import { Template } from './template.entity';
import { ActiveTaskChecklist } from './active-task-checklist.entity';
import { Unit } from './unit.entity';
import { Property } from './property.entity';
import { UnitGroup } from './unit-group.entity';
import { Organization } from './organization.entity';

@Entity('task_rule')
export class TaskRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ type: 'enum', enum: TaskType, nullable: true })
  task_type?: string;

  @Column({ nullable: true })
  task_description?: string;

  @Column({ nullable: true })
  task_title?: string;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ type: 'int', nullable: true })
  cost_amount?: number;

  @Column({
    type: 'enum',
    enum: ExecutionMomentType,
    default: ExecutionMomentType.Arrival,
  })
  execution_moment!: string;

  @Column({ type: 'enum', enum: StayType, nullable: true })
  stay_type?: string;

  @Column('int', { nullable: true, array: true })
  stay_days?: number[];

  @Column('int', { nullable: true })
  weekly_day?: number;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: string;

  @Column({ type: 'enum', enum: RateUnit, default: RateUnit.HOURLY })
  cost_type!: string;

  @Column({ type: 'enum', nullable: true, enum: ConditionType })
  condition?: string;

  @Column({ nullable: true })
  additional_condition?: string;

  //single property for each task rule
  @Column({ nullable: true })
  property_id?: number;

  // Use the mapping when property entity is ready

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  // @ApiProperty({ type: () => Property })
  property?: Property;

  @Column({ nullable: true })
  template_id?: number;

  @ManyToOne(() => Template, (template) => template.taskRules, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template?: Template;

  @OneToMany(
    () => ActiveTaskChecklist,
    (activeTaskChecklist) => activeTaskChecklist.task_rule,
  )
  active_task_checklists?: ActiveTaskChecklist[];

  @Column({ default: false })
  is_default_checklist!: boolean;

  @Column({ default: false })
  is_executed!: boolean;

  @Column({ default: false })
  is_non_reservation!: boolean;

  // Use this when Unit entity will be moved to virtual-inspect-svc

  @ManyToMany(() => Unit)
  @JoinTable({ name: 'task_rule_units' })
  units?: Unit[];

  @Column('int', { nullable: true, array: true })
  amenties?: number[];

  // @Column('int', { array: true })
  // @ApiProperty()
  // unit_group_ids?: number[];

  // Use this IF unit group entity will be added and used

  @ManyToMany(() => UnitGroup)
  @JoinTable({ name: 'task_rule_unit_groups' })
  unit_groups?: UnitGroup[];

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id", referencedColumnName: "id" })
  organization?: Organization;

  @Column({ nullable: true })
  organization_id?: number;

  @Column({ type: 'bool', nullable: false, default: true })
  ai_executor_assignment!: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
