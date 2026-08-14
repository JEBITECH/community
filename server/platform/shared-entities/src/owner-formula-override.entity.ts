import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { OwnerFormula } from './owner-formula.entity';
import { ProductConditionDto } from './dto/product-condition.dto';
import { ValueType } from './enums/value-type.enum';
import { FormulaType } from './enums/FormulaType.enum';
import { RevenueSplitType } from './enums/RevenueSplitType.enum';
import { PartialPaymentType } from './enums/partialpayment.enum';
import { OverLappingReservationType } from './enums/overlappingreservation.enum';
import { BaseValueType } from './enums/basevaluetype.enum';
import { DistrubitionChannel } from './distribution-channel.entity';
import { PeriodFrequency } from './enums/period-frequency.enum';
import { PostingDay } from './enums/posting-day.enum';
import { Weekday } from './enums/weekday.enum';

@Entity('owner_formula_override')
export class OwnerFormulaOverride {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "int4", nullable: false })
  formula_id!: number;

  @ManyToOne(() => OwnerFormula, (formula) => formula.instance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formula_id', referencedColumnName: 'id' })
  parent_formula!: OwnerFormula;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({ type: "enum", enum: BaseValueType, nullable: true, default: null })
  base_value?: BaseValueType;

  @Column({ type: "enum", nullable: false, enum: ValueType })
  value_type!: ValueType;

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

  @Column({ type: "int4", nullable: true })
  product_mgmt_percent?: number;

  @Column({ type: "int4", nullable: true })
  base_value_percentage?: number;

  @Column({ type: "int4", nullable: true })
  owner_percentage?: number;

  @Column({ type: "enum", enum: OverLappingReservationType, nullable: true, default: null })
  overlapping_reservation?: OverLappingReservationType;

  @Column({ type: "enum", enum: PartialPaymentType, nullable: true, default: null })
  partial_payments?: PartialPaymentType;

  @Column('text', { array: true, nullable: true })
  ota_types?: string[];

  @Column('text', { array: true, nullable: true })
  reservation_types?: string[];

  @Column({ type: "enum", enum: FormulaType, nullable: true, default: null })
  formula_type?: FormulaType;

  @Column({ type: "enum", enum: RevenueSplitType, nullable: true, default: null })
  revenue_type?: RevenueSplitType;

  @Column({ type: "int4", nullable: false, default: 0 })
  monthly_fixed_amount!: number;

  @Column({ type: 'jsonb', nullable: true })
  selected_product_types?: Record<string, string[]>;

  @Column('jsonb', { nullable: true })
  channels?: DistrubitionChannel[] | null;

  @Column({ type: "varchar", nullable: true })
  arrival_date?: string;

  @Column({ type: "varchar", nullable: true })
  departure_date?: string;

  @Column({ type: 'jsonb', nullable: true })
  fixed_calc?: {
    fixed_amount: number,
    period_frequency: PeriodFrequency,
    no_of_days: number,
    posting_day: PostingDay,
    time: string, // HH:mm
    selected_weekday: Weekday
  };
}
