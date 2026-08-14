import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { RawInvoiceVendor } from "./raw-invoice-vendor";
import { RawPayments } from "./raw-payments";
import { RawGueust } from "./raw-guests";
import { RawListings } from "./raw-listings";
import { dataProcessingStatus } from "./enums/DATA_PROCESSING_STATUS.enum";

@Entity()
export class RawReservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  pms_id!: string;

  @Column({ nullable: true })
  pms_acc_id?: number;

  @Column({ nullable: true })
  organization_id?: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ type: "jsonb", nullable: true })
  integration: any;

  @Column({ type: "jsonb", nullable: true })
  review: any;

  @Column({ type: "jsonb", nullable: true })
  guestStay: any;

  @Column({ nullable: false, default: false })
  manuallyCreated!: boolean;

  @Column({ type: "jsonb", nullable: true })
  creationInfo: any;

  @Column({ nullable: true })
  accountId?: string;

  @Column({ nullable: true })
  confirmationCode?: string;

  @Column({
    default: dataProcessingStatus.PENDING,
    type: "enum",
    enum: dataProcessingStatus,
    nullable: false
  })
  data_processing_status?: dataProcessingStatus;  // raw reservation process status - NEW, PROCESSED, ERROR, etc.

  @Column({ type: "varchar", nullable: true })
  reservation_status?: string;  // Guesty reservation status - reserved, confirmed, canceled, etc.

  @Column({ type: "jsonb", nullable: true })
  guest: any;

  @Column({ nullable: true, name: "unit_id" })
  unitId?: string;

  @Column({ nullable: true, type: "varchar", name: "unit_id_int" })
  unitIdInt: any;

  @Column({ nullable: true, type: "jsonb" })
  unitRaw: any;

  @Column({ nullable: true })
  source?: string;

  @Column({ type: "jsonb", nullable: true })
  listing: any;

  @Column({ nullable: true })
  cancellationPolicy?: string;

  @Column({ nullable: true })
  guestsCount?: number;

  @Column({ type: "jsonb", nullable: true })
  numberOfGuests: any;

  @Column({ nullable: true })
  nightsCount?: number;

  @Column({ nullable: true })
  checkIn?: string;

  @Column({ nullable: true })
  checkOut?: string;

  @Column({ nullable: true })
  checkInDateLocalized?: string;

  @Column({ nullable: true })
  checkOutDateLocalized?: string;

  @Column({ nullable: true })
  plannedArrival?: string;

  @Column({ nullable: true })
  plannedDeparture?: string;

  @Column({ type: "jsonb", nullable: true })
  money: any;

  @Column({ nullable: true, name: "raw_guest_pms_id" })
  rawGuestPmsId?: string;

  @Column({ nullable: true, name: "raw_listing_pms_id" })
  rawListingPmsId?: string;

  @OneToMany(() => RawInvoiceVendor, (inv) => inv.reservation, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  invoices?: RawInvoiceVendor[];

  @OneToMany(() => RawPayments, (pay) => pay.reservation, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  payments?: RawPayments[];

  @ManyToOne(() => RawGueust, (rawguest) => rawguest.reservations, {
    nullable: true,
    cascade: ["insert", "update"],
  })
  @JoinColumn({ name: "raw_guest_pms_id", referencedColumnName: "pms_id" })
  rawGuest?: RawGueust;

  @ManyToOne(() => RawListings, (rawlisting) => rawlisting.reservations, {
    nullable: true,
    cascade: ["insert", "update"],
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "raw_listing_pms_id", referencedColumnName: "pms_id" })
  rawListing?: RawListings;

  @Column({ default: false })
  isReturningGuest!: boolean;

  @Column({ nullable: true })
  confirmedAt?: string;

  @Column({ nullable: true })
  reservationDate?: string;

  // Income entry processing tracking columns
  @Column({ default: false })
  processed_for_income_entry!: boolean;

  @Column({ nullable: true })
  income_entry_id?: number;

  @Column({ nullable: true })
  income_entry_reference?: string;

  @Column({ nullable: true })
  processing_error?: string;

  @Column({ nullable: true })
  processed_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
