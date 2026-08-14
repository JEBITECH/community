
import {
  Entity, Column, PrimaryGeneratedColumn, JoinTable, ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Property, Unit, OwnerGroup, Organization, User, NormalizedReservation, FormulaUnitLink } from '@shared/entities'

@Entity()
export class OwnerSettlement {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => NormalizedReservation, (normalizedReservation) => normalizedReservation.settlement)
  normalized_reservations?: NormalizedReservation[];

  @Column()
  name!: string;

  @Column({ default: null })
  user_id?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ nullable: true, type: 'int4' })
  formula_unit_link_id?: number | null;

  @ManyToOne(() => FormulaUnitLink)
  @JoinColumn({ name: 'formula_unit_link_id' })
  formula_unit_link?: FormulaUnitLink;

  @Column({ nullable: true, type: 'date' })
  arrival_from?: string;

  @Column({ nullable: true, type: 'date' })
  arrival_to?: string;

  @Column({ nullable: true, type: 'date' })
  departure_from?: string;

  @Column({ nullable: true, type: 'date' })
  departure_to?: string;

  @Column({ nullable: true, type: 'date' })
  expense_bill_date_from?: string;

  @Column({ nullable: true, type: 'date' })
  expense_bill_date_to?: string;

  @Column({ nullable: false })
  settlement_type!: number;

  @Column({ default: false })
  isprevious_unsettled_expense!: boolean;

  @Column({ default: false })
  isprevious_unsettled_reservation!: boolean;

  // @Column({ default: false })
  // is_settlement_deleted: boolean;

  @Column({ nullable: true })
  settlement_of_month?: string;

  @ManyToMany(() => Unit, { eager: true })
  @JoinTable({
    name: 'owner_settlement_units',
    joinColumn: {
      name: 'owner_monthly_settlement_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'unit_id',
      referencedColumnName: 'id',
    },
  })
  selected_units!: Unit[];

  @ManyToMany(() => Property, { eager: true })
  @JoinTable({
    name: 'owner_settlement_property',
    joinColumn: {
      name: 'owner_monthly_settlement_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'property_id',
      referencedColumnName: 'id',
    },
  })
  selected_property!: Property[];

  @ManyToMany(() => OwnerGroup, { eager: true })
  @JoinTable({
    name: 'owner_settlement_ownergroup',
    joinColumn: {
      name: 'owner_monthly_settlement_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'ownergroup_id',
      referencedColumnName: 'id',
    },
  })
  selected_ownergroup?: OwnerGroup[];

  @Column({ default: 0 }) //0-unsettled, 1-settled
  status!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
  organization!: Organization;

  @Column({ nullable: true })
  organization_id?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;

}