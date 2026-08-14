
import { Property } from './property.entity';

import { Team } from './team.entity';
import { Unit } from './unit.entity';
import { User } from './user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

@Entity()
export class UnitGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  code?: string;

  @Column()
  name!: string;

  @Column()
  description?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  property_id?: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id', referencedColumnName: 'id' })
  property?: Property;

  // @Column({ nullable: true })

  // employee_id: number;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })

  // employee: User;

  @ManyToMany(() => User, { nullable: true })
  @JoinTable({
    name: 'unit_groups_employee',
    joinColumn: { name: 'unit_groups_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'employee_id',
      referencedColumnName: 'id',
    },
  })
  employees?: User[];

  @ManyToMany(() => Unit, { nullable: true })
  @JoinTable({
    name: 'unit_groups_unit',
    joinColumn: { name: 'unit_groups_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'unit_id',
      referencedColumnName: 'id',
    },
  })
  units?: Unit[];

  @ManyToMany(() => Team, { nullable: true })
  @JoinTable({
    name: 'unit_group_team',
    joinColumn: { name: 'unit_group_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'team_id',
      referencedColumnName: 'id',
    },
  })
  teams?: Team[];

  @Column('int', { array: true, nullable: true })
  unit_sequence?: number[];

  // @Column({ nullable: true })

  // unit_Type_id: number;

  // @OneToOne(() => UnitType)
  // @JoinColumn({ name: 'unit_Type_id' })
  // @ApiProperty({ type: () => UnitType })
  // unit_Type: UnitType;

  // @Column({ nullable: true })

  // task_rule_id: number;

  // @ManyToOne(() => TaskRule)
  // @JoinColumn({ name: 'task_rule_id', referencedColumnName: 'id' })

  // task_rule: TaskRule;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
