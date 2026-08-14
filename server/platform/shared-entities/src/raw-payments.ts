import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RawReservation } from "./raw-reservation";
import { dataProcessingStatus } from "./enums/DATA_PROCESSING_STATUS.enum";

@Entity()
export class RawPayments {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  organization_id!: number;

  @Column({ nullable: false, unique: true })
  pms_id!: string;

  @Column({ nullable: true, name: "raw_reservation_pms_id" })
  rawReservationPmsId?: string;

  @Column({ nullable: false })
  pms_acc_id!: number;

  @Column({ nullable: false, type: "decimal", precision: 15, scale: 2 })
  amount!: number;

  @Column({nullable: false})
  currency!: string;

  @Column({name: "payment_status", nullable: true})
  paymentStatus?: string;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ type: "jsonb", nullable: false, name: "raw_json_data" })
  rawJsonData: any;

  @Column({
    default: dataProcessingStatus.PENDING,
    type: "enum",
    enum: dataProcessingStatus,
    nullable: false
  })
  status!: dataProcessingStatus;

  // Receipt entry processing tracking columns
  @Column({nullable: false, default: false })
  processed_for_receipt_entry!: boolean;

  @Column({ nullable: true })
  receipt_entry_id?: number;

  @Column({ nullable: true })
  receipt_entry_reference?: string;

  @Column({ nullable: true })
  processing_error?: string;

  @Column({ nullable: true })
  processed_at?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => RawReservation, (r) => r.payments, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "raw_reservation_pms_id",
    referencedColumnName: "pms_id",
  })
  reservation?: RawReservation;
}
