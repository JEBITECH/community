import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RawListings } from "./raw-listings";
import { dataProcessingStatus } from "./enums/DATA_PROCESSING_STATUS.enum";

@Entity()
export class RawTax {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, })
  pms_id!: string;

  @Column({ nullable: true })
  pms_acc_id?: number;

  @Column({ nullable: true })
  organization_id?: number;

  @Column({ nullable: true, name: "raw_listing_pms_id" })
  rawListingPmsId?: string;

  @Column({ type: "jsonb", nullable: true, name: "raw_json_data" })
  rawJsonData: any;

  @ManyToOne(() => RawListings, (listing) => listing.rawTaxes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
  @JoinColumn({
    name: "raw_listing_pms_id",
    referencedColumnName: "pms_id",
  })
  rawListing?: RawListings;

  @Column({
    default: dataProcessingStatus.PENDING,
    type: "enum",
    enum: dataProcessingStatus,
    nullable: false
  })
  status?: dataProcessingStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
