import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Charges } from './charges.entity';
import { Unit } from './unit.entity';
import { Property } from './property.entity';
import { IsObject } from 'class-validator';
import { Organization } from './organization.entity';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Unit, (unit) => unit.entries, { eager: true, nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @Column({ nullable: true })
  organization_id?: number;

  @ManyToOne(() => Property, (property) => property.entries, { eager: true, nullable: true })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  @IsObject()
  organization?: Organization;

  @ManyToOne(() => Charges, { eager: true, nullable: true })
  @JoinColumn({ name: 'charge_id' })
  chargeType?: Charges | null;

  @Column({ enum: ['income', 'expense', 'manual'] })
  source!: string;

  @Column({ nullable: true })
  type!: number;

  @Column()
  date!: string;

  @Column()
  details!: string;

  @Column({ name: 'owner_amt', type: 'numeric' })
  ownerAmt!: number;

  @Column({ name: 'pmc_amt', type: 'numeric' })
  pmcAmt!: number;

  @Column({ nullable: true })
  status!: string;
}
