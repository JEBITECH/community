import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Template } from './template.entity';
import { Unit } from './unit.entity';

@Entity()
export class UnitCost {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Unit, (unit) => unit.unitCosts)
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @ManyToOne(() => Template, (template) => template.unitCosts, {
    nullable: true,
  })
  @JoinColumn({ name: 'template_id' })
  template?: Template;

  @Column()
  title!: string;

  @Column('float')
  cost!: number;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;
}
