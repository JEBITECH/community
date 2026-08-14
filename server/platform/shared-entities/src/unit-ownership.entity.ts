import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Unit } from './unit.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('unit_ownership')
export class UnitOwnership {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int4', nullable: false })
  unit_id!: number;

  @Column({ type: 'varchar', nullable: false })
  owner_id!: string;

  @Column({ type: 'date', nullable: false })
  start_date!: string;

  @Column({ type: 'date', nullable: true })
  end_date?: string | null;

  @Column({ type: 'int4', nullable: false })
  organization_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  // Computed field (not stored in DB)
  is_locked?: boolean;
}
