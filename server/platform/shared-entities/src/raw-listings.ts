import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RawOwnerships } from "./raw-ownerships";
import { dataProcessingStatus } from "./enums/DATA_PROCESSING_STATUS.enum";
import { RawReservation } from "./raw-reservation";
import { RawTax } from "./raw.tax";
import { Unit } from "./unit.entity";

@Entity("raw_listings")
export class RawListings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  organization_id!: number;

  @Column({ nullable: false, unique: true })
  pms_id!: string;

  @Column({ nullable: false })
  pms_acc_id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  hostName?: string;

  @Column()
  roomType!: string;

  @Column({ nullable: true })
  propertyType?: string;

  @Column({ type: "jsonb", nullable: true, name: "raw_json_data" })
  rawJsonData: any;

  @OneToOne(() => Unit, unit => unit.listing, { 
    nullable: true,
    onDelete: "NO ACTION"
  })
  // @JoinColumn({ name: "pms_id", referencedColumnName: "pms_id" })
  unit?: Unit;

  @OneToMany(() => RawReservation, (res) => res.rawListing, {
    onDelete: "SET NULL",
  })
  reservations?: RawReservation[];

  @OneToMany(() => RawTax, (tax) => tax.rawListing, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  rawTaxes?: RawTax[];

  @OneToMany(() => RawOwnerships, (ownerships) => ownerships.rawListing, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  rawOwnerships?: RawOwnerships[];

  @Column({
    default: dataProcessingStatus.PENDING,
    type: "enum",
    enum: dataProcessingStatus,
    nullable: false
  })
  //  raw listing processing status - PENDING, IN_PROGRESS, PROCESSED, ERROR, etc.
  status!: dataProcessingStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;
}
