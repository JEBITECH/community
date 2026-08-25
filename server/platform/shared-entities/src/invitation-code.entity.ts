import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Organization } from "./organization.entity";

/**
 * Invite-only join codes for organizations whose membership_model is
 * 'invite_only'. A code can be shared with multiple people up to max_uses.
 */
@Entity("invitation_code")
export class InvitationCode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @Column({ type: "varchar", unique: true })
  @Index()
  code!: string;

  @Column({ type: "int", default: 1 })
  max_uses!: number;

  @Column({ type: "int", default: 0 })
  uses_count!: number;

  @Column({ type: "timestamptz", nullable: true })
  expires_at?: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
