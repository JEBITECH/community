import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";

export type MemberType = "internal" | "external";
export type MembershipStatus = "pending" | "active" | "suspended" | "rejected";

/**
 * Join entity between a User and an Organization: one user can hold multiple
 * memberships (one per org), each with its own role/classification/unit. This
 * is the source of truth for "who is this user, in this org" — User itself
 * carries no organization_id or role.
 */
@Entity("membership")
@Unique(["user_id", "organization_id"])
export class Membership {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  user_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "int" })
  @Index()
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @Column({ type: "varchar" })
  role!: string;

  @Column({ type: "int", nullable: true })
  roleId?: number;

  @Column({ type: "varchar", default: "internal" })
  member_type!: MemberType;

  @Column({ type: "varchar", nullable: true })
  unit_identifier?: string;

  @Column({ type: "varchar", default: "pending" })
  status!: MembershipStatus;

  @Column({ type: "boolean", default: true })
  directory_visible!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  joined_at?: Date;

  @Column({ type: "uuid", nullable: true })
  approved_by_user_id?: string;

  @Column({ type: "boolean", default: false })
  is_default!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
