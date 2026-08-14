import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Property } from "./property.entity";
import { Unit } from "./unit.entity";
import { UnitGroup } from "./unit-group.entity";
import { TaskRule } from "./task-rule.entity";
import { UnitType } from "./unit-type.entity";
import { PlanningStatus } from "./enums/planningstatus.enum";

@Entity()
export class TaskPlanning {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  property_id?: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @ManyToMany(() => Unit)
  @JoinTable()
  units?: Unit[];

  @ManyToMany(() => UnitGroup)
  @JoinTable()
  unit_groups?: UnitGroup[];

  @ManyToMany(() => TaskRule)
  @JoinTable()
  task_configs?: TaskRule[];

  @ManyToMany(() => UnitType)
  @JoinTable()
  unit_types?: UnitType[];

  @Column({
    enum: PlanningStatus,
    default: PlanningStatus.Created,
    nullable: true,
  })
  status?: string;

  @Column({ type: 'timestamptz', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date?: Date;

  @Column('bigint', { nullable: true, array: true })
  execution_time?: number[];

  @CreateDateColumn({ nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ nullable: false })
  updated_at!: Date;
}
