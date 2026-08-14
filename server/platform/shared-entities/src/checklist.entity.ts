
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskType } from './enums/task-type.enum';
import { AreaType } from './enums/area-type.enum';
import { Organization } from './organization.entity';
import { Status } from './enums/status.enum';

@Entity('task_checklist')
export class Checklist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  checklist_code?: string;

  @Column()
  checklist_title?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true, type: 'enum', enum: AreaType })
  area_type?: AreaType;

  @Column({ nullable: true, type: 'enum', enum: TaskType })
  task_type?: TaskType;

  @Column({ default: false })
  default!: boolean;

  @Column()
  organization_id?: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  // @ManyToMany(() => TaskTemplate, { nullable: true })
  // @JoinTable({
  //   name: 'task_template_checklists',
  //   joinColumn: { name: 'task_checklist_id', referencedColumnName: 'id' },
  // })
  // @ApiProperty()
  // task_templates: TaskTemplate[];

  // @ManyToMany(() => UnitArea, { nullable: true })
  // @JoinTable({
  //   name: 'task_template_checklists',
  //   joinColumn: { name: 'task_checklist_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: {
  //     name: 'unit_area_id',
  //     referencedColumnName: 'id',
  //   },
  // })
  // @ApiProperty()
  // unit_areas: UnitArea[];

  @Column('int', { nullable: true, array: true, default: [] })
  cat_element_id?: number[];

  // @Column({ nullable: true })
  // cat_amentity_id?: number;

  // @ManyToOne(() => Amentity)
  // @JoinColumn({ name: 'cat_amentity_id' })
  // @ApiProperty({ type: () => Amentity })
  // amentity: Amentity;
// we don't have seperate product or amenties it will be added from elements categories
  // @Column({ nullable: true })
  // cat_product_id?: number;

  // @ManyToOne(() => Product)
  // @JoinColumn({ name: 'cat_product_id' })
  // @ApiProperty({ type: () => Product })
  // product: Product;

  @Column('int', { nullable: true, array: true, default: [] })
  all_cat_ids?: number[];

  @Column('text', { nullable: true, array: true, default: [] })
  checklist_condition?: string[];

  @Column({ default: false })
  is_guest_selected?: boolean;

  @Column({ nullable: true })
  category_type?: string;

  @Column({ type: 'enum', enum: Status, default: Status.Active })
  status?: string;

  // @OneToMany(() => QrConfig, (qrConfig) => qrConfig.productChecklist)
  // productConfigs: QrConfig[];

  // @OneToMany(() => QrConfig, (qrConfig) => qrConfig.issueChecklist)
  // issueConfigs: QrConfig[];
}
