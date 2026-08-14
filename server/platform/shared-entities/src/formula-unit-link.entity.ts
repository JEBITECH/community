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
import { OwnerFormula } from './owner-formula.entity';
import { Organization } from './organization.entity';

@Entity('formula_unit_link')
export class FormulaUnitLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int4', nullable: false })
  unit_id!: number;

  @Column({ type: 'int4', nullable: false })
  ownerformula_id!: number;

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

  @ManyToOne(() => Unit, (unit) => unit.formulaUnitLinks,)
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @ManyToOne(() => OwnerFormula)
  @JoinColumn({ name: 'ownerformula_id' })
  ownerformula?: OwnerFormula;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  // Computed field (not stored in DB)
  is_locked?: boolean;
}
