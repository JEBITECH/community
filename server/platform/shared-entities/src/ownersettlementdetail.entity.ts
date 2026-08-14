
import {
  Entity, Column, PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class OwnerSettlementDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  settlement_id?: number

  @Column({ nullable: true })
  settlement_name?: string

  @Column({ nullable: true })
  unit_details?: string

  @Column({ nullable: true, })
  owner_name?: string

  @Column({ nullable: false })
  reservation_id!: number

  @Column({ nullable: true })
  property_id?: number

  @Column({ nullable: true })
  unit_id?: number

  @Column({ nullable: true })
  reservation_number?: string

  @Column({ nullable: true })
  date?: string

  @Column({ nullable: true })
  arrival_date?: string

  @Column({ nullable: true })
  departure_date?: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  owner_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pmc_amount?: number;

  @Column({ nullable: true })
  overlapping?: boolean

  @Column({ default: true })
  status !: boolean

  @Column({ nullable: true })
  expense_id?: number

  @Column({ nullable: true })
  settlement_type?: number;

  @Column({ nullable: true })
  owner_id?: string

  @Column({ nullable: true })
  additional_cost_id?: number


}