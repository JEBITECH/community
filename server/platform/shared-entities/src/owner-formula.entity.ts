import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Unit } from "./unit.entity";
import { FormulaType } from "./enums/FormulaType.enum";
import { RevenueSplitType } from "./enums/RevenueSplitType.enum";
import { BaseValueType } from "./enums/basevaluetype.enum";
import { ValueType } from "./enums/value-type.enum";
import { OverLappingReservationType } from "./enums/overlappingreservation.enum";
import { PartialPaymentType } from "./enums/partialpayment.enum";
import { ProductConditionDto } from "./dto/product-condition.dto";
import { OwnerFormulaOverride } from "./owner-formula-override.entity";
import { Organization } from "./organization.entity";

@Entity("owner_formula")
export class OwnerFormula {
  constructor(formula: Partial<OwnerFormula>) {
    Object.assign(this, formula);
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false, unique: true })
  formula_name!: string;

  @Column({ type: "enum", enum: FormulaType, nullable: true, default: null })
  formula_type?: FormulaType;

  @Column({ type: "enum", enum: RevenueSplitType, nullable: true, default: null })
  revenue_type?: RevenueSplitType;

  @Column({ type: "int4", nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ type: "enum", enum: BaseValueType, nullable: true, default: null })
  base_value?: BaseValueType;

  @Column({ type: "enum", nullable: false, enum: ValueType })
  value_type!: ValueType;

  @Column({ type: "int4", nullable: true })
  base_value_percentage?: number;

  @Column({ type: "int4", nullable: false, default: 0 })
  monthly_fixed_amount!: number;

  @Column({ type: 'json', nullable: true })
  internal_addon?: ProductConditionDto;

  @Column({ type: 'json', nullable: true })
  addon_fees?: ProductConditionDto;

  @Column({ type: 'json', nullable: true })
  ota_commission?: ProductConditionDto;

  @Column({ type: 'json', nullable: true })
  tax?: ProductConditionDto;

  @Column({ type: 'json', nullable: true })
  discounts?: ProductConditionDto;

  @Column({ type: 'json', nullable: true })
  cleaning?: ProductConditionDto;

  @Column({ type: 'jsonb', nullable: true })
  selected_product_types?: Record<string, string[]>;

  @Column({ type: "int4", nullable: true })
  product_mgmt_percent?: number;

  @Column({ type: "int4", nullable: true })
  owner_percentage?: number;

  @Column({ type: "enum", enum: OverLappingReservationType, nullable: true, default: null })
  overlapping_reservation?: OverLappingReservationType;

  @Column({ type: "enum", enum: PartialPaymentType, nullable: true, default: null })
  partial_payments?: PartialPaymentType;

  @Column({ type: "text", array: true, nullable: true })
  ota_types?: string[];

  @Column({ type: "text", array: true, nullable: true })
  reservation_types?: string[];

  @Column({ type: "varchar", nullable: true })
  arrival_date?: string;

  @Column({ type: "varchar", nullable: true })
  departure_date?: string;

  @OneToMany(() => OwnerFormulaOverride, (override) => override.parent_formula, {
    nullable: true,
    cascade: ['insert', 'update'],
  })
  instance?: OwnerFormulaOverride[];

  @OneToMany(() => Unit, (unit) => unit.ownerformula, {
    nullable: true
  })
  units?: Unit[];

  @OneToMany(
    () => Unit,
    (unit) => unit.current_ownerformula,
  )
  currentUnits?: Unit[];

  @CreateDateColumn({ type: "timestamp", nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp", nullable: false })
  updated_at!: Date;
}
