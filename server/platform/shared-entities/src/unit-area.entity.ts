import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { Property } from "./property.entity";
import { UnitType } from "./unit-type.entity";
import { UserStatus } from "./enums/user-status.enum";

@Entity("unit_area")
export class UnitArea {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int4", nullable: false })
  organization_id!: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ type: "int4", nullable: false })
  property_id!: number;

  @Column({ type: "varchar", nullable: false })
  area_name!: string;

  @Column({ type: "varchar", nullable: true })
  area_code?: string;

  @Column({ type: "varchar", nullable: true })
  area_squarefeet?: string;

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @Column({ type: "varchar", nullable: true })
  area_type?: string;

  @Column({ type: "int4", nullable: true })
  unit_type_id?: number;

  @ManyToOne(() => UnitType)
  @JoinColumn({ name: "unit_type_id" })
  unit_type?: UnitType;

  @ManyToOne(() => Property)
  @JoinColumn({ name: "property_id" })
  property?: Property;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization?: Organization;

  @Column({ nullable: false, default: true })
  status?: boolean;

  @Column({ nullable: true, type: "varchar", unique: true })
  pms_id?: string;

  @CreateDateColumn({ nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ nullable: false })
  updated_at!: Date;


}
