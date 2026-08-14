
import { TaskPriority } from './enums/task-priority.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from './enums/task-status.enum';
import { TaskType } from './enums/task-type.enum';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Template } from './template.entity';
import { Team } from './team.entity';
import { RateUnit } from './enums/rate-unit.enum';
import { UnitCost } from "./unit-cost.entity";
import { Cost } from './cost.entity';
import { Image } from './dto/task/image.dto';
import { GuestyTask } from './guesty-task.entity';
import { TaskChecklistImage } from './task-checklist-image.entity';
import { InspectionStatus } from './enums/inspection-status.enum';
import { TaskInspection } from './task-inspection.entity';
import { ActiveTaskChecklist } from './active-task-checklist.entity';
import { AdditionalCost } from './additional.cost.entity';
import { Unit } from './unit.entity';
import { OwnerQuery } from './owner-query.entity';
import { UnitType } from './unit-type.entity';
import { Property } from './property.entity';
import { Element } from './element.entity';
import { TaskRule } from './task-rule.entity';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => AdditionalCost, (additionalCost) => additionalCost.task, {
    cascade: true,
  })
  additional_costs!: AdditionalCost[];

  @Column({ nullable: false, type: 'varchar' })
  task_title!: string;

  @Column({ nullable: true, type: 'varchar' })

  task_description?: string;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    nullable: false,
  })
  priority!: string;




  //Elements should only be accessed through ActiveTaskChecklist so removed element_id.


  @Column({ type: 'int4', nullable: true })
  issue_category_id?: number;

  @Column({ type: 'int4', nullable: true })
  issue_type_id?: number;

  @Column({ type: 'int4', nullable: false })
  unit_id!: number;

  // uncomment when unit entity is moved to virtual-inspect-svc

  @ManyToOne(() => Unit)
  @JoinColumn({
    name: 'unit_id',
  })

  unit!: Unit;

  @Column({
    type: 'enum',
    enum: TaskType,
    nullable: true
  })
  task_type?: string;

  @Column({ type: 'int4', nullable: true })
  unit_type_id?: number;

  @ManyToOne(() => UnitType)
  @JoinColumn({
    name: 'unit_type_id',
  })
  unit_type?: UnitType;

  @Column({ type: 'int4', nullable: false })
  property_id!: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'int4', nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({
    name: 'organization_id',
  })
  organization!: Organization;

  @Column({ type: 'int4', nullable: true })
  template_id?: number;

  @ManyToOne(() => Template)
  @JoinColumn({
    name: 'task_template_id',
  })
  task_template?: Template;

  @Column({ type: 'uuid', nullable: false })
  created_by_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'created_by_id',
  })
  created_by!: User;

  @Column({ type: 'int4', nullable: true })
  assigned_to_team_id?: number;

  @ManyToOne(() => Team)
  @JoinColumn({
    name: 'assigned_to_team_id',
  })
  assigned_to_team?: Team;

  @Column({ type: 'uuid', nullable: true })
  assigned_to_id?: string;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'assigned_to_id',
  })
  assigned_to?: User;

  @Column({ type: 'uuid', nullable: true })
  inspected_by_id?: string;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'inspected_by_id',
  })
  inspected_by?: User;

  @Column({ type: 'int4', nullable: true })
  vendor_id?: number;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'vendor_id',
  })
  vendor?: User;

  @Column({ type: 'jsonb', nullable: true })
  task_photos?: Image[];

  @Column({ type: 'jsonb', nullable: true })
  reference_images?: Image[];


  @Column({ type: 'jsonb', nullable: true })
  executor_photos?: Image[];

  @Column({ type: 'jsonb', nullable: true })
  executor_videos?: Image[];

  @Column({ type: 'jsonb', nullable: true })
  executor_captions?: { comment: string }[];

  @Column({ type: 'int4', nullable: true })
  estimated_time?: number;

  @Column({ type: 'int4', nullable: true })
  expected_completion_minutes?: number;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expected_completion_at?: Date;

  @Column({ type: 'int4', nullable: true })
  rate_amount?: number;

  @Column({
    type: 'enum',
    nullable: false,
    enum: RateUnit,
    default: RateUnit.HOURLY,
  })
  rate_unit!: string;

  @Column({ type: 'bool', nullable: false, default: false })
  pet_present?: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  isDefaultPhoto?: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  auto_submit_detection?: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  auto_submit_difference?: boolean;

  @OneToMany(
    () => ActiveTaskChecklist,
    (activeTaskChecklist) => activeTaskChecklist.task,
  )
  active_task_checklists!: ActiveTaskChecklist[];

  @Column({ type: 'bool', nullable: false, default: true })
  remote_inspection!: boolean;

  @OneToMany(() => TaskInspection, (taskInspection) => taskInspection.task)
  task_inspection?: [TaskInspection];

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    nullable: false,
    default: InspectionStatus.Pending,
  })
  inspection_status!: string;

  @Column({ type: 'int4', nullable: true })
  quality_rating?: number;

  @Column({ type: 'jsonb', nullable: true })
  comments?: JSON;

  @Column({ type: 'bigint', nullable: true })
  time_spent?: number;

  @Column({ type: 'bigint', nullable: true })
  start_time?: number;

  @Column({ type: 'bigint', nullable: true })
  end_time?: number;

  @Column({ type: 'bigint', nullable: true })
  time_diff?: number;

  @Column({ type: 'bigint', nullable: true })
  source_task_id?: number;

  @Column('text', { array: true, nullable: true })
  linkedreservation?: string[];

  @ManyToOne(() => Task)
  @JoinColumn({
    name: 'source_task_id',
  })
  source_task?: Task;

  // uncomment when video steam is ready

  // @OneToOne(() => VideoStream, (videoStream) => videoStream.task)
  // @ApiProperty({ type: () => VideoStream })
  // video_stream: VideoStream;

  @Column({ type: 'int4', nullable: true })
  source_issue_id?: number;

  @Column({ type: 'int4', nullable: true })
  taskPlanning_id?: number;

  @Column({ type: 'int4', nullable: true, default: 1 })
  sequence?: number;

  @Column({ type: 'int4', nullable: true })
  source_rule_id?: number;

  @Column({ type: 'timestamptz', nullable: true })
  assigned_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  due_at?: Date;

  @Column({ type: 'varchar', nullable: true })
  due_time?: string;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  inspected_at?: Date;

  @Column({ type: 'varchar', nullable: true })
  delay_reason?: string;

  @OneToMany(() => OwnerQuery, (ownerQuery) => ownerQuery.task, {
    nullable: true,
  })
  owner_querries?: OwnerQuery[];

  @Column({ type: 'int4', nullable: true })
  unit_cost_id?: number;

  @ManyToOne(() => UnitCost, { nullable: true })
  @JoinColumn({ name: 'unit_cost_id' })
  unit_cost?: UnitCost;

  @Column({ type: 'float', nullable: true })
  cost_per_month?: number;

  @Column({ type: 'float', nullable: true })
  cost_per_hour?: number;

  @OneToOne(() => Cost, (cost) => cost.task, { nullable: true })
  cost?: Cost;

  @OneToOne(() => TaskChecklistImage, (checklistImage) => checklistImage.task, {
    nullable: true,
  })
  checklist_image?: TaskChecklistImage;

  @Column({ type: 'int4', nullable: true })
  reservation_id?: number;

  @Column({ type: 'varchar', nullable: true })
  room_id?: string;

  @Column({ type: 'varchar', nullable: true })
  recording_id?: string;

  // uncomment when NormalizedReservation is moved to Virtual inspect service

  // @ManyToOne(() => Reservation)
  // @JoinColumn({ name: 'reservation_id', referencedColumnName: 'id' })
  // 
  // reservation: NormalizedReservation;

  @Column({ type: 'jsonb', nullable: true })
  ai_inspection_media?: Image[];

  @Column({ type: 'bool', nullable: false, default: true })
  is_approved!: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  is_guest_task!: boolean;

  @Column({ type: 'bool', nullable: false, default: true })
  is_image_upload_checklist_level!: boolean;

  @OneToOne(() => GuestyTask, (guestyTask) => guestyTask.task, {
    nullable: true,
  })
  @JoinColumn({ name: 'guesty_task_id', referencedColumnName: 'id' })
  guesty_task?: GuestyTask;

  @Column({ type: 'enum', enum: TaskStatus, nullable: false })
  status!: string;

  @ManyToOne(() => TaskRule)
  @JoinColumn({ name: "task_rule_id", referencedColumnName: "id" })
  task_rule?: TaskRule;

  @Column({ nullable: true })
  task_rule_id?: number;

  @Column({ type: 'bool', nullable: false, default: true })
  ai_executor_assignment!: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updated_at?: Date;
}
