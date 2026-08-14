import { OwnerFormula } from './owner-formula.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OwnerGroupUnit } from './ownergroupunit.entity';
import { NormalizedReservation } from './normalized-reservation';
import { Unit } from './unit.entity';
import { Property } from './property.entity';
// import { Owner } from 'src/owner/entities/owner.entity';
import { OwnerGroup } from './ownergroup.entity';
import { User } from './user.entity';
import { OwnerSettlement } from './ownersettlement.entity';
@Entity()
export class OwnerGroupSettlement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  settlement_id?: number;

  @ManyToOne(() => OwnerSettlement)
  @JoinColumn({ name: 'settlement_id', referencedColumnName: 'id' })
  settlement?: OwnerSettlement;

  @Column("int", { array: true, nullable: true })
  reservations?: number[];

  @Column("int", { array: true, nullable: true })
  reservations_folio_id?: number[];

  //   @OneToOne(() => Reservation)
  //   @JoinColumn({ name: 'reservation_id', referencedColumnName: 'id' })
  //   reservation: Reservation;

  @Column({ nullable: true })
  property_id?: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id', referencedColumnName: 'id' })
  property?: Property;

  @Column({ nullable: true })
  unit_id?: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id', referencedColumnName: 'id' })
  unit?: Unit;

  @Column({ default: null })
  user_id?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: User; //its owner

  @Column({ type: 'decimal', precision: 10, scale: 5, default: 0 })
  owner_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 5, default: 0 })
  actual_owner_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 5, default: 0 })
  pmc_amount?: number;

  @Column({ nullable: true })
  ownergroup_id?: number;

  @ManyToOne(() => OwnerGroup)
  @JoinColumn({ name: 'ownergroup_id', referencedColumnName: 'id' })
  ownergroup?: OwnerGroup;

  @Column({ default: 0 })
  totalnights?: number;

  @Column({ default: 0 })
  NumberOfNightsUnitLocked?: number;

  @Column({ default: 0 })
  OwnerUsedNights?: number;

  @Column({ default: 0 })
  totalnightsinMonth?: number

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}


