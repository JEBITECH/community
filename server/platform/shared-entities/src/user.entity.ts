import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { IsNumber, IsObject } from "class-validator";
import { Organization } from "./organization.entity";
import { UserBankAccount } from "./user-bank-account.entity";
import { UserAddress } from "./user-address.entity";
import { OwnerDetailsDto } from "./dto/owner-details-dto";
import { ReservationDetailsDto } from "./dto/reservation-details.dto";
import { TaskTypesDto } from "./dto/task-types.dto";
import { UnitDetailsDto } from "./dto/unit-details.dto";


const bcrypt = require("bcryptjs");

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ nullable: true, type: "varchar", unique: true })
  pms_id?: string;

  @Column({ type: "varchar", nullable: false })
  firstName!: string;

  @Column({ type: "varchar", nullable: true })
  lastName?: string;

  @Column({ unique: true, type: "varchar", nullable: false })
  email!: string;

  @Column({ type: Date, nullable: true })
  dob?: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "varchar", nullable: true })
  password?: string;

  @Column({ default: "user", type: "varchar", nullable: false })
  role!: string;

  @Column({ nullable: true, type: "integer" })
  roleId?: number;

  @Column({ type: 'jsonb', nullable: true })
  docs?: any[];

  @Column({ nullable: true, type: "varchar" })
  emailVerificationToken?: string;

  @Column({ nullable: true, type: "timestamptz" })
  emailVerificationExpires?: Date;

  @Column({ nullable: true, type: "varchar" })
  resetPasswordToken?: string;

  @Column({ nullable: true, type: "timestamptz" })
  resetPasswordExpires?: Date;

  @Column({ nullable: true, type: "varchar" })
  refreshToken?: string;

  @Column({ default: false, type: "boolean", nullable: false })
  isActive!: boolean;

  @Column({ type: "boolean", nullable: true, default: false })
  external_user?: boolean;

  @Column({ type: "varchar", nullable: true })
  owner_type?: string;

  @CreateDateColumn({ type: "timestamp", nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", nullable: false })
  updatedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  property_ids?: number[];

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id", referencedColumnName: "id" })
  @IsObject()
  organization!: Organization;

  @Column({ nullable: true })
  @IsNumber()
  organization_id?: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ type: 'bool', nullable: false, default: false })
  is_task_view!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  task_types?: TaskTypesDto;

  @Column({ type: 'bool', nullable: false, default: false })
  is_reservation_view!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  reservation_details?: ReservationDetailsDto;

  @Column({ type: 'bool', nullable: false, default: false })
  is_owner_view!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  owner_details?: OwnerDetailsDto;

  @Column({ type: 'bool', nullable: false, default: false })
  is_unit_view!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  unit_types?: UnitDetailsDto;

  @Column({ type: 'bool', nullable: false, default: false })
  is_document_view!: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  is_graph_view!: boolean;

  @Column({ nullable: true })
  cost_per_hour?: number;

  @Column({ nullable: true })
  cost_per_month?: number;

  @Column({ type: 'bool', nullable: true, default: false })
  include_trip_cost?: boolean;

  @Column({ nullable: true })
  cost_per_km?: number;

  @Column('float', { nullable: true, array: true })
  location_coordinate?: number[];

  @Column('float', { nullable: true, array: true })
  location_coordinate_end?: number[];

  @Column({ type: "varchar", nullable: true, default: null })
  fcm_token?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  company_identification_number?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  tax_number?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  freefield1?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  freefield2?: string;

  @OneToMany(() => UserBankAccount, (bank_account) => bank_account.user, {
    cascade: ["insert", "update"],
  })
  bank_account?: UserBankAccount[];

  @OneToMany(() => UserAddress, (address) => address.user, {
    cascade: ["insert", "update"],
  })
  address?: UserAddress[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (
      this.password &&
      !this.password.startsWith("$2a$") &&
      !this.password.startsWith("$2b$")
    ) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    console.log("Plain password:", password);
    console.log(" Stored hash:", this.password);
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const obj: any = { ...this };
    delete obj.password;
    delete obj.refreshToken;
    delete obj.emailVerificationToken;
    delete obj.resetPasswordToken;
    return obj;
  }
}
function ApiProperty(): (target: User, propertyKey: "cost_per_hour") => void {
  throw new Error("Function not implemented.");
}

