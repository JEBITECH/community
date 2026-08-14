import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { PmsMaster } from "./pms-master.entity";
import { AmenityDto } from "./dto/amenity.dto";
import { GuestConfig } from "./guest-config.entity";
import { Entry } from "./manual.entries.entity";



@Entity("property")
export class Property {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int4", nullable: false })
  organization_id!: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  // id from pms_master table
  @Column({ type: "int4", nullable: true })
  pms_acc_id?: number;

  @ManyToOne(() => PmsMaster)
  @JoinColumn({ name: "pms_acc_id", referencedColumnName: "id" })
  pms_master!: PmsMaster;

  // account Id from PMS account entity 
  @Column({ type: "varchar", nullable: true })
  pms_account_id?: string;

  @Column({ type: "text", nullable: false })
  property_name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "text", nullable: false })
  property_code!: string;

  @Column({ nullable: true })
  property_type?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ type: "jsonb", nullable: true })
  images?: any[];

  @Column({ type: "jsonb", nullable: true })
  main_image?: any;

  @Column({ type: "varchar", nullable: true })
  address?: string;

  @Column({ type: "varchar", nullable: true })
  city?: string;

  @Column({ type: "varchar", nullable: true })
  state?: string;

  @Column({ type: "varchar", nullable: true })
  province?: string;

  @Column({ type: "varchar", nullable: true })
  country?: string;

  @Column({ type: "varchar", nullable: true })
  country_code?: string;

  @Column({ nullable: true })
  zipcode?: string;

  @Column({ type: "varchar", nullable: true })
  lat?: string;

  @Column({ type: "varchar", nullable: true })
  lng?: string;

  @Column({ type: "varchar", nullable: true })
  timezone?: string;

  @Column({ type: "boolean", nullable: false, default: true })
  status?: boolean;

  @Column({ type: "jsonb", nullable: true })
  amenities?: AmenityDto[];

  @Column({ type: "time", nullable: true })
  workingFrom?: string;

  @Column({ type: "time", nullable: true })
  workingTo?: string;

  @OneToMany(() => GuestConfig, (guestConfig) => guestConfig.property, {
    nullable: true,
  })
  guest_configs?: GuestConfig[];

  @OneToMany(() => Entry, (entry) => entry.property, { nullable: true })
  entries?: Entry[];

  @CreateDateColumn({ nullable: false, type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ nullable: false, type: "timestamptz" })
  updated_at!: Date;
}
