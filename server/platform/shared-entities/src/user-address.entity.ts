import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Country } from "./country.entity";
import { User } from "./user.entity";

@Entity("user_address")
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid", nullable: false })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: User;

  @Column({ type: "varchar", nullable: true })
  address_type?: string;

  @Column({ type: "varchar", nullable: true })
  full?: string;

  @Column({ nullable: true })
  country_id?: number;

  @Column({ type: "varchar", nullable: true })
  street?: string;

  @Column({ type: "varchar", nullable: true })
  address_line_1?: string;

  @Column({ type: "varchar", nullable: true })
  address_line_2?: string;

  @ManyToOne(() => Country, { cascade: ["insert", "update"] })
  @JoinColumn({ name: "country_id", referencedColumnName: "id" })
  country?: Country;

  @Column({ nullable: true })
  province?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  zip_code?: string;

  @Column({ type: "float", nullable: true })
  lat?: number;

  @Column({ type: "float", nullable: true })
  lng?: number;

  @Column({ type: "bool", default: false, nullable: false })
  is_default!: boolean;

  @Column({ type: "bool", default: false, nullable: false })
  is_active!: boolean;
}
