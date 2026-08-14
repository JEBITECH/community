
import { Organization } from './organization.entity';
import { Status } from './enums/status.enum';

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
import { UnitCost } from './unit-cost.entity';
import { TaskType } from './enums/task-type.enum';
import { Checklist } from './checklist.entity';
import { TaskRule } from './task-rule.entity';
import { Unit } from './unit.entity';
import { UnitArea } from './unit-area.entity';
import { UnitType } from './unit-type.entity';

@Entity('task_template')
export class Template {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => UnitCost, (unitCost) => unitCost.template)
  unitCosts?: UnitCost[];

  @Column({ unique: true, nullable: false })
  template_code!: string;

  @Column({ nullable: false })
  template_name!: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  default!: boolean;

  @Column({ nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @ManyToMany(() => Unit, (unit) => unit.templates)
  units?: Unit[];

  @Column({ type: 'enum', enum: TaskType, nullable: true })
  task_type?: string;

  @ManyToMany(() => UnitType)
  @JoinTable({
    name: 'task_template_unit_type',
    joinColumn: { name: 'template_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'unit_type_id', referencedColumnName: 'id' },
  })
  unit_types?: UnitType[];

  @OneToMany(() => TaskRule, (taskRule) => taskRule.template)
  taskRules?: TaskRule[];

  @ManyToMany(() => Checklist, { nullable: true })
  @JoinTable({
    name: 'task_template_task_checklist',
    joinColumn: { name: 'template_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'task_checklist_id',
      referencedColumnName: 'id',
    },
  })
  checklists?: Checklist[];

  // uncomment when unit entity is added to virtual-inspect-svc

  @ManyToMany(() => UnitArea, { nullable: true })
  @JoinTable({
    name: 'task_template_unit_area',
    joinColumn: { name: 'task_template_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'unit_area_id',
      referencedColumnName: 'id',
    },
  })
  unit_areas?: UnitArea[];

  @Column('text', { nullable: true, array: true, default: [] })
  area_types?: string[];

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.Active,
    nullable: false,
  })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
