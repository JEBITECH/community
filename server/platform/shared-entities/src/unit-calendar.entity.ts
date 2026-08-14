import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { listingStatus } from "./enums/listing-status.enum";
import { Unit } from "@shared/entities";

@Entity("unit_calendar")
@Unique(['listing_id', 'date']) // if composite
export class UnitCalendar {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false })
  date!: string;

  @Column({ type: "text", nullable: false })
  listing_id!: string;

  @Column({ type: "text", nullable: true })
  reservation_pms_id?: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: "listing_id", referencedColumnName: "pms_id" })
  unit!: Unit;

  @Column({ type: "int2", nullable: true })
  base_min_nights?: number;

  @Column({ type: "float4", nullable: true })
  base_price?: number;

  @Column({ type: "varchar", nullable: true })
  currency?: string;

  @Column({ type: "bool", nullable: true })
  is_base_min_nights?: boolean;

  @Column({ type: "bool", nullable: true })
  is_base_price?: boolean;

  @Column({ type: "bool", nullable: true })
  is_base_restrictions?: boolean;

  @Column({ type: "int2", nullable: true })
  max_nights?: number;

  @Column({ type: "int2", nullable: true })
  min_nights?: number;

  @Column({ type: "bool", nullable: true })
  notDefaultAvailability?: boolean;

  @Column({ type: "int2", nullable: true })
  price?: number;

  @Column({
    type: "enum",
    enum: listingStatus,
    nullable: false,
    default: listingStatus.AVAILABLE,
  })
  status!: listingStatus;
}
