import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { NormalizedReservation } from "./normalized-reservation";

export enum ReservationGroupType {
  MULTI_CITY = "multi_city",
  GROUP_BOOKING = "group_booking",
}

export enum ReservationGroupStatus {
  PENDING = "pending",
  RESERVED = "reserved",
  CONFIRMED = "confirmed",
  PARTIALLY_CONFIRMED = "partially_confirmed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

/**
 * Booking-time snapshot of a single leg. Stored as JSONB, so keys stay
 * camelCase (JSON payload, not columns).
 *
 * This exists for the two things that are NOT recoverable from the child
 * reservations:
 *   1. `quotationId` — the price we actually quoted the guest. Not carried
 *      on the reservations table.
 *   2. Failed legs — a leg whose PMS reservation could not be created never
 *      produces a child row, so without this its error would be lost and the
 *      group would silently look smaller than what the guest attempted.
 *
 * Everything else (dates, nights, amounts, destination) is duplicated here
 * only as an immutable record of what was agreed at checkout; the live values
 * always come from the child reservations.
 */
export interface ReservationGroupLeg {
  legOrder: number;
  destination: string;
  listingId: string;
  quotationId?: string;
  pmsReservationId?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount?: number;
  currency?: string;
  success: boolean;
  error?: string;
}

/**
 * Parent record tying multiple PMS reservations into one logical booking.
 *
 * Deliberately thin. Each leg still produces its own PMS reservation, and thus
 * its own raw_reservation + reservations row, so trip dates, nights, guest
 * details, totals, currency and source are all read from the children via the
 * `reservations` relation rather than duplicated here. Only what cannot be
 * derived is stored:
 *
 *   - group_ref                 the guest-facing booking reference
 *   - type                      multi-city vs group booking
 *   - status                    materialized so admin lists can filter/sort
 *                               without a join+aggregate, and so a group that
 *                               failed before creating any PMS reservation can
 *                               still be represented
 *   - child_pms_reservation_ids the link itself; written at creation time so a
 *                               child can find its parent when it later syncs
 *   - legs                      booking-time snapshot (quotation ids, failed legs)
 */
@Entity("reservation_groups")
@Index(["organization_id", "status"])
@Index(["group_ref"], { unique: true })
export class ReservationGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Guest-facing booking reference (e.g. MC-A7F2K9) */
  @Column({ name: "group_ref", nullable: false, unique: true })
  group_ref!: string;

  @Column({ name: "organization_id", type: "int4", nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @Column({
    name: "type",
    type: "enum",
    enum: ReservationGroupType,
    default: ReservationGroupType.MULTI_CITY,
    nullable: false,
  })
  type!: ReservationGroupType;

  @Column({
    name: "status",
    type: "enum",
    enum: ReservationGroupStatus,
    default: ReservationGroupStatus.PENDING,
    nullable: false,
  })
  status!: ReservationGroupStatus;

  /**
   * PMS reservation IDs of this group's children, written when the PMS
   * reservations are created. This is the link: a child arriving later through
   * the sync pipeline is matched to its parent by looking its pmsId up in this
   * array (GIN indexed).
   *
   * Also doubles as the expected child count, which is what makes
   * "partially confirmed" detectable.
   */
  @Column("text", {
    name: "child_pms_reservation_ids",
    array: true,
    nullable: false,
    default: () => "'{}'",
  })
  child_pms_reservation_ids!: string[];

  /** Immutable booking-time snapshot per leg — see ReservationGroupLeg */
  @Column({ name: "legs", type: "jsonb", nullable: true })
  legs?: ReservationGroupLeg[];

  /**
   * Child reservations. Everything derivable (trip dates, nights, totals,
   * guest, currency, source) is read from here.
   */
  @OneToMany(
    () => NormalizedReservation,
    (reservation) => reservation.parentReservation,
  )
  reservations?: NormalizedReservation[];

  /** Group-level failure that is not attributable to any single leg */
  @Column({ name: "processing_error", type: "text", nullable: true })
  processing_error?: string;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
