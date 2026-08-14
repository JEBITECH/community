import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChargeType } from './enums/charge_type.enum';
import { Status } from './enums/status.enum';
import { ChargesRates } from './charges-rates.entity';
import { ChargesUnitsMapping } from './charges_units_mapping.entity';
import { ValueType } from './enums/value-type.enum';
import { Entry } from './manual.entries.entity';



@Entity('charges')
export class Charges {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ enum: ChargeType })
  type!: string;

  @Column({ type: 'jsonb', nullable: true })
  frequency?: { cycle: string; value: string };

  @Column({ nullable: true })
  bill_date?: Date;

  @Column()
  organization_id!: number;

  @Column({ nullable: true })
  pms_id?: number;

  @Column({ enum: Status, default: Status.Active })
  status!: string;

  @OneToMany(() => ChargesRates, (rates) => rates.charges, {
    nullable: true,
    cascade: true,
    orphanedRowAction: 'delete',
  })
  chargeRates?: ChargesRates[];

  @OneToMany(() => Entry, (entry) => entry.chargeType)
  entries?: Entry[];

  @Column({ enum: ValueType, nullable: true })
  rate_type?: string;

  @Column({ enum: ['OWNER_SHARE', 'NET_RENT', 'GROSS_RENT'], nullable: true })
  percent_of?: 'OWNER_SHARE' | 'NET_RENT' | 'GROSS_RENT';

  @OneToMany(() => ChargesUnitsMapping, (mapping) => mapping.charges, {
    nullable: true,
    cascade: true,
  })
  units_mapping?: ChargesUnitsMapping[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
