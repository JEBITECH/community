import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OwnerGroup } from './ownergroup.entity';
import { Unit } from "./unit.entity"; // adjust path as needed
import { Property } from "./property.entity";
import { User } from "./user.entity";
@Entity()
export class OwnerGroupUnit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  property_id!: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @Column()
  unit_id!: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit!: Unit;

  @Column()
  ownergroup_id!: number;

  @ManyToOne(() => OwnerGroup, (ownerGroup) => ownerGroup.ownergroupunit)
  @JoinColumn({ name: 'ownergroup_id' })
  ownergroup!: OwnerGroup;

  @Column()
  user_id?: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ default: null })
  ledger?: string

  @Column({ default: null })
  settlement_type?: string

  @Column({ default: null })
  value?: number

  @Column({ type: 'date', nullable: true })
  start_date?: string | null;

  @Column({ type: 'date', nullable: true })
  end_date?: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;

}
