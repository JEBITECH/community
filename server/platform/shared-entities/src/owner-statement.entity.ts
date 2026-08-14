import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OwnerSettlement } from './ownersettlement.entity';
import { User } from './user.entity';
import { Unit } from './unit.entity';
import { UnitOwnership } from './unit-ownership.entity';
import { Organization } from './organization.entity';

@Entity()
export class OwnerStatement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true })
  owner_name?: string;

  @Column({ nullable: true })
  unit_name?: string;

  @Column({ nullable: true })
  property_name?: string;

  @Column({ default: 0 }) // 0 = Generated, 1 = Uploaded
  status!: number;

  @Column({ nullable: true })
  file_path?: string;

  @ManyToOne(() => OwnerSettlement)
  @JoinColumn({ name: 'settlement_id' })
  settlement?: OwnerSettlement;

  @Column({ nullable: false })
  settlement_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @Column({ nullable: true })
  owner_id?: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @Column({ nullable: true })
  unit_id?: number;

  @Column({ nullable: true, type: 'int4' })
  unit_ownership_id?: number | null;

  @ManyToOne(() => UnitOwnership)
  @JoinColumn({ name: 'unit_ownership_id' })
  unit_ownership?: UnitOwnership;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
  organization?: Organization;

  @Column({ nullable: true })
  organization_id?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
