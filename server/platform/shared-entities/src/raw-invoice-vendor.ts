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

@Entity({ name: "raw_invoice_vendor" })
export class RawInvoiceVendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  organization_id!: number;

  @Column({ nullable: false, unique: true })
  pms_id!: string;

  @Column({ nullable: false })
  pms_acc_id!: number;

  @Column({ nullable: true, name: "raw_reservation_pms_id" })
  rawReservationPmsId?: string;

  @Column({ nullable: false, type: "decimal", precision: 15, scale: 2 })
  amount!: number;

  @Column({ nullable: false })
  currency!: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: "jsonb", nullable: false, name: "raw_json_data" })
  rawJsonData: any;

  @Column({
    default: dataProcessingStatus.PENDING,
    type: "enum",
    enum: dataProcessingStatus,
    nullable: false
  })
  status!: dataProcessingStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => RawReservation, (r) => r.invoices, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "raw_reservation_pms_id",
    referencedColumnName: "pms_id",
  })
  reservation?: RawReservation;
}
