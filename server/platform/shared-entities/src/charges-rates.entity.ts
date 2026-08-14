import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Charges } from './charges.entity';

@Entity('charges_rates')
export class ChargesRates {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  charge_id!: number;

  @Column()
  range_from!: Date;

  @Column()
  range_to!: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  value!: number;

  @JoinColumn({ name: 'charge_id' })
  @ManyToOne(() => Charges, (charges) => charges.chargeRates, {
    onDelete: 'CASCADE',
  })
  charges!: Charges;
}
