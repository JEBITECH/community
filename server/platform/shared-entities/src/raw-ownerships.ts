import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { RawListings } from "./raw-listings";
import { RawOwners } from "./raw-owners";
import { Unit } from './unit.entity';

@Entity()
@Unique(['rawOwner', 'rawListing'])
export class RawOwnerships {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  pms_acc_id?: number;

  @Column({ nullable: true })
  organization_id?: number;

  @Column({ nullable: false, name: "raw_owner_pms_id" })
  rawOwnerPmsId!: string;

  @Column({ nullable: false, name: "raw_listing_pms_id" })
  rawListingPmsId!: string;

  @Column({ nullable: true })
  unit_id?: number;

  @Column({ nullable: false, default: 100 })
  share!: number;

  @ManyToOne(() => RawListings, (listing) => listing.rawOwnerships, {
    onDelete: "CASCADE",
    cascade: ['insert', 'update']
  })
  @JoinColumn({ name: "unit_id", referencedColumnName: "id" })
  units?: Unit;

  @ManyToOne(() => RawListings, (listing) => listing.rawOwnerships, {
    onDelete: "CASCADE",
    cascade: ['insert', 'update']
  })
  @JoinColumn({ name: "raw_listing_pms_id", referencedColumnName: "pms_id" })
  rawListing?: RawListings;

  @ManyToOne(() => RawOwners, (owner) => owner.rawOwnerships, {
    onDelete: "CASCADE",
    cascade: ['insert', 'update']
  })
  @JoinColumn({ name: "raw_owner_pms_id", referencedColumnName: "pms_id" })
  rawOwner?: RawOwners;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
