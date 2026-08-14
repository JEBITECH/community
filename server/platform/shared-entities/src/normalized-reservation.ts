import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Unit } from "./unit.entity";
import { OwnerSettlement } from "./ownersettlement.entity";
import { Property } from "./property.entity";
import { ReservationAddons } from "./reservation-addons.entity";
import { Organization } from "./organization.entity";
import { Guest } from "./guest.entity";
import { ReservationGroup } from "./reservation-group.entity";

export interface ReservationTravelParty {
  first_name: string;
  last_name: string;
  email: string;
  isEmailSent?: boolean;
}


@Entity("reservations")
@Index(["organizationId", "pmsAccId"])
@Index(["organizationId", "checkIn", "checkOut"])
@Index(["organizationId", "status"])
@Index(["confirmationCode"])
export class NormalizedReservation {
  @PrimaryGeneratedColumn()
  id!: number;

  // Core identifiers
  @Column({ type: "int4", nullable: false })
  organizationId!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ nullable: false })
  pmsAccId!: number;

  @Column({ nullable: false, unique: true })
  pmsId!: string;

  @Column({ nullable: false })
  pmsName!: string; // 'guesty', 'dharma', etc.

  // Reservation details
  @Column({ nullable: true })
  confirmationCode?: string;

  @Column({ nullable: false })
  status!: string; // NEW, CONFIRMED, CANCELLED, etc.

  @Column({ nullable: true })
  source?: string; // airbnb, booking.com, direct, etc.

  // Guest information (normalized from guest object)
  @Column({ nullable: true })
  guestId?: string; // PMS guest ID

  @Column({ nullable: true })
  guestFirstName?: string;

  @Column({ nullable: true })
  guestLastName?: string;

  @Column({ nullable: true })
  guestEmail?: string;

  @Column({ nullable: true })
  guestPhone?: string;

  @Column({ nullable: false, default: false })
  isReturningGuest!: boolean;

  // Unit/Listing information
  // @Column({ name: "listingId", nullable: true })
  // listingId?: string; // PMS listing ID

  // @Column({ nullable: true })
  // listingTitle?: string;

  @Column({ nullable: true })
  unitId?: string;

  @Column({ nullable: true })
  unitName?: string;

  @Column({ nullable: true })
  propertyType?: string;

  @Column({ nullable: true })
  hostName?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reservationDate!: Date;

  // Dates and duration
  @Column({ type: "date", nullable: false })
  checkIn!: Date;

  @Column({ type: "date", nullable: false })
  checkOut!: Date;

  @Column({ nullable: true })
  checkInDateLocalized?: string;

  @Column({ nullable: true })
  checkOutDateLocalized?: string;

  @Column({ nullable: true })
  plannedArrival?: string;

  @Column({ nullable: true })
  plannedDeparture?: string;

  @Column({ nullable: true })
  nightsCount?: number;

  // Guest counts
  @Column({ nullable: true })
  guestsCount?: number;

  @Column({ nullable: true })
  adultsCount?: number;

  @Column({ nullable: true })
  childrenCount?: number;

  @Column({ nullable: true })
  infantsCount?: number;

  @Column({ nullable: true })
  petsCount?: number;

  // Financial information (normalized from money object)
  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  totalAmount?: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  accommodationFare?: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  cleaningFare?: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  totalTaxes?: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  totalFees?: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  hostPayout?: number;

  @Column({ nullable: true })
  currency?: string;

  // Integration and external references
  @Column({ type: "jsonb", nullable: true })
  integrationData: any; // airbnb, booking.com specific data

  @Column({ nullable: true })
  externalId?: string; // External booking ID

  @Column({ nullable: true })
  externalNotificationId?: string;

  // Cancellation policy
  @Column({ nullable: true })
  cancellationPolicy?: string;

  // Creation and update tracking
  @Column({ type: "jsonb", nullable: true })
  creationInfo: any; // creator, updater info

  @Column({ nullable: true })
  confirmedAt?: Date;

  @Column({ nullable: true })
  pmsUpdatedAt?: Date;

  // Processing status
  @Column({ nullable: true })
  processingError?: string;

  @Column({ nullable: true })
  lastSyncedAt?: Date;

  // Raw data reference (for debugging and data integrity)
  @Column({ nullable: false })
  rawReservationId!: number; // Reference to raw_reservation.id

  @ManyToOne(() => Unit)
  @JoinColumn({ name: "unitId", referencedColumnName: "id" })
  unit?: Unit;

  @Column({ nullable: true })
  settlement_id?: number;

  @ManyToOne(() => OwnerSettlement, (settlement) => settlement.normalized_reservations, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'settlement_id' })
  settlement?: OwnerSettlement;

  // 0 means reservation is not freezed and 1 means freezed
  @Column({ default: 0 })
  is_reservation_freezed_status!: number;

  @Column("text", { array: true, nullable: false, default: '{}' })
  settlement_overlapping_reservation!: string[];

  @Column({ default: 0 })
  total_settlement_needed!: number;

  @Column({ default: 0 })
  total_settlement_done!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  owner_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prpty_mngmt_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  franchisor_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  franchisee_amount?: number;

  @Column({ type: 'jsonb', nullable: true })
  // @ApiProperty({
  //     type: 'object',
  //     additionalProperties: {
  //         type: 'object',
  //         properties: {
  //             basevalue: { type: 'number' },
  //             owner_payout: { type: 'number' },
  //             prpty_mngmt_payout: { type: 'number' },
  //             included_amount: { type: 'number' },
  //             excluded_amount: { type: 'number' },
  //             avg_Price_for_each_day_for_unit_or_bill_amount: { type: 'number' },
  //             Total_nights_in_month: { type: 'number' },
  //             unit_value_or_bill_amount_value: { type: 'number' }
  //         },
  //     },
  // })
  month_wise_amount?: {
    [month: string]: {
      basevalue: number;
      owner_payout: number;
      prpty_mngmt_payout: number;
      included_amount: number;
      excluded_amount: number;
      avg_Price_for_each_day_for_unit_or_bill_amount: number,
      Total_nights_in_month: number,
      unit_value_or_bill_amount_value: number
    };
  };

  franchise_month_wise_amount?: {
    [month: string]: {
      basevalue: number;
      owner_payout: number;
      prpty_mngmt_payout: number;
      included_amount: number;
      excluded_amount: number;
      avg_Price_for_each_day_for_unit_or_bill_amount: number,
      Total_nights_in_month: number,
      unit_value_or_bill_amount_value: number
    };
  };

  @Column({ default: false })
  is_owner_own_use!: boolean;

  @Column({ nullable: true })
  nights?: number;

  @Column({ type: "int4", nullable: true })
  property_id?: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id', referencedColumnName: 'id' })
  property?: Property;

  @Column({ type: 'jsonb', nullable: true })
  add_ons?: {
    [key: string]: ReservationAddons[];
  };

  @Column({ default: false })
  is_calculated!: boolean;

  @Column({ nullable: true })
  primary_guest_id?: number;

  @ManyToMany(() => Guest, guest => guest.reservations, {
    cascade: false,
  })
  @JoinTable({
    name: 'reservation_guests',
    joinColumn: {
      name: 'reservation_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'guest_id',
      referencedColumnName: 'id',
    },
  })
  guests?: Guest[];


  @Column({ default: false })
  is_planned!: boolean;

  @Column({ default: false })
  is_planned_arrival!: boolean;

  @Column({ default: false })
  is_planned_departure!: boolean;

  @Column({ default: false })
  is_planned_stay!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  planning_date?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  travel_party?: ReservationTravelParty[];


  @Column({ default: false })
  is_revenue_type_fixed!: boolean;

  // ─── Multi-city / group booking linkage ─────────────────────
  // Nullable so single-property reservations (the vast majority) are
  // unaffected. Populated during normalization when the reservation's
  // pmsId is found in a parent group's child_pms_reservation_ids.

  @Column({ name: "parent_reservation_id", type: "int4", nullable: true })
  parent_reservation_id?: number | null;

  @ManyToOne(() => ReservationGroup, (group) => group.reservations, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parent_reservation_id" })
  parentReservation?: ReservationGroup;

  /** Position of this reservation within its parent itinerary (0-based) */
  @Column({ name: "leg_order", type: "int4", nullable: true })
  leg_order?: number | null;

  /** Destination city for this leg (denormalized for display/filtering) */
  @Column({ name: "destination_city", nullable: true })
  destination_city?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
