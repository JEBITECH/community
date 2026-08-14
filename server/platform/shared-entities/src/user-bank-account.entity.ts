import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("user_bank_account")
export class UserBankAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: true })
  bank_owner_name?: string;

  @Column({ type: "varchar", nullable: true })
  bank_account_number?: string;

  @Column({ type: "varchar", nullable: true })
  bank_account_code?: string;

  @Column({ type: "bool", default: false, nullable: false })
  is_active!: boolean;

  @CreateDateColumn({ type: "timestamp", nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", nullable: false })
  updatedAt!: Date;

  @Column({ type: "uuid", nullable: false })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: User;
}
