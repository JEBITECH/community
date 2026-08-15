import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from "typeorm";
import { UserBankAccount } from "./user-bank-account.entity";
import { UserAddress } from "./user-address.entity";

const bcrypt = require("bcryptjs");

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "varchar", nullable: false })
  firstName!: string;

  @Column({ type: "varchar", nullable: true })
  lastName?: string;

  @Column({ unique: true, type: "varchar", nullable: true })
  email?: string | null;

  @Column({ type: Date, nullable: true })
  dob?: string;

  @Column({ unique: true, type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "boolean", default: false })
  phone_verified!: boolean;

  @Column({ type: "varchar", nullable: true })
  otp_code_hash?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  otp_expires_at?: Date | null;

  @Column({ type: "int", default: 0 })
  otp_attempts!: number;

  @Column({ type: "timestamptz", nullable: true })
  otp_last_requested_at?: Date | null;

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

  /**
   * True for platform-level guest accounts that are never a member of any
   * organization (e.g. a one-off external registrant before any Membership
   * exists). Per-organization internal/external classification lives on
   * Membership.member_type, not here.
   */
  @Column({ type: "boolean", nullable: true, default: false })
  external_user?: boolean;

  @CreateDateColumn({ type: "timestamp", nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", nullable: false })
  updatedAt!: Date;

  @Column({ type: "varchar", nullable: true, default: null })
  fcm_token?: string;

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
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const obj: any = { ...this };
    delete obj.password;
    delete obj.refreshToken;
    delete obj.emailVerificationToken;
    delete obj.resetPasswordToken;
    delete obj.otp_code_hash;
    return obj;
  }
}
