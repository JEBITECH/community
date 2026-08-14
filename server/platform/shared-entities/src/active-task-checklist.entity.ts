
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskRule } from './task-rule.entity';
import { CheckListStatus } from './enums/checklist-status.enum';
import { InspectionStatus } from './enums/inspection-status.enum';
import { Task } from './task.entity';
import { AreaType } from './enums/area-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitArea } from './unit-area.entity';
import { Amentity } from './amentity.entity';
import { Product } from './product.entity';
import { Image } from './dto/task/image.dto';


@Entity()
export class ActiveTaskChecklist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int4', nullable: true })
  checklist_id?: number;

  @Column({ type: 'varchar', nullable: false })
  checklist_title!: string;

  @Column({ type: 'varchar', nullable: true })
  checklist_code?: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'int4', nullable: true })
  task_id?: number;

  @ManyToOne(() => Task, (task) => task.active_task_checklists)
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ type: 'jsonb', nullable: true })
  checklist_images?: Image[];

  @Column({ type: 'jsonb', nullable: true })
  checklist_videos?: Image[];

  @Column({ type: 'int4', nullable: true })
  task_rule_id?: number;

  @ManyToOne(() => TaskRule, (task_rule) => task_rule.active_task_checklists)
  @JoinColumn({ name: 'task_rule_id' })
  task_rule!: TaskRule;

  @Column({ type: 'int4', nullable: true })
  unit_area_id?: number;

  // Use when UnitArea Module is moved to Virtual inspect service

  @ManyToOne(() => UnitArea)
  @JoinColumn({ name: 'unit_area_id' })
  @ApiProperty()
  unit_area?: UnitArea;

  // Raw element ids array (kept for fast read/filter without join). Always populated alongside `elements`.
  @Column('int', { nullable: true, array: true, default: [] })
  cat_element_id?: number[];

  // Many-to-many with Element via junction table `active_task_checklist_elements` (referential integrity).
  // Populated from the parent Checklist template on task create/update.
  // @ManyToMany(() => Element)
  // @JoinTable({
  //   name: 'active_task_checklist_elements',
  //   joinColumn: { name: 'active_task_checklist_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'element_id', referencedColumnName: 'id' },
  // })
  // @ApiPropertyOptional({ type: () => [Element] })
  // elements?: Element[];

  @Column({ nullable: true })
  @ApiProperty()
  cat_amentity_id?: number | undefined;

  @ManyToOne(() => Amentity)
  @JoinColumn({ name: 'cat_amentity_id' })
  @ApiProperty({ type: () => Amentity })
  amentity?: Amentity;

  @Column({ nullable: true })
  @ApiProperty()
  cat_product_id?: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'cat_product_id' })
  @ApiProperty({ type: () => Product })
  product?: Product;






  @Column('int', { nullable: true, array: true, default: [] })
  all_cat_ids?: number[];

  @Column('text', { nullable: true, array: true, default: [] })
  checklist_condition?: string[];

  @Column({ type: 'varchar', nullable: true })
  selected_checklist_condition?: string;

  @Column({ type: 'bool', default: false })
  is_guest_selected!: boolean;

  @Column({ type: 'varchar', nullable: true })
  category_type?: string;

  @Column({ type: 'enum', enum: AreaType, nullable: false })
  area_type!: string;

  @Column({
    type: 'enum',
    enum: CheckListStatus,
    default: CheckListStatus.Pending,
    nullable: false,
  })
  checklist_status!: string;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.Pending,
  })
  inspection_status!: string;
}
