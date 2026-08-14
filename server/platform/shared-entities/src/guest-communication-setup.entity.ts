import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";

@Entity("guest_communication_setup")
export class GuestCommunicationSetup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int4", nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @Column({ type: "boolean", nullable: false, default: false })
  display_name_property!: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  display_name_unit!: boolean;

  @Column({ type: "text", nullable: true })
  guest_welcome_message?: string;

  @Column({ type: "text", nullable: true })
  qr_message?: string;

  @CreateDateColumn({ nullable: false, type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ nullable: false, type: "timestamptz" })
  updated_at!: Date;
}
