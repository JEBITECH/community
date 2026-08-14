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
import { Charges } from './charges.entity';
import { Unit } from './unit.entity';

@Entity('charges_units_mapping')
@Unique(['charge_id', 'unit_id'])
export class ChargesUnitsMapping {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  charge_id!: number;

  @Column({ nullable: true })
  unit_id!: number;

  @JoinColumn({ name: 'charge_id' })
  @ManyToOne(() => Charges, (charges) => charges.chargeRates, {
    onDelete: 'CASCADE',
  })
  charges!: Charges;

  @JoinColumn({ name: 'unit_id' })
  @ManyToOne(() => Unit, (unit) => unit.chargesMapping, {
    onDelete: 'CASCADE',
  })
  unit!: Unit;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
