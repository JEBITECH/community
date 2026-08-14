import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Property } from "./property.entity";
import { ImageDto } from "./dto/image.dto";
import { AmenityDto } from "./dto/amenity.dto";
import { Organization } from "./organization.entity";
import { UnitArea } from "./unit-area.entity";
import { Amentity } from "./amentity.entity";

@Entity("unit_type")
export class UnitType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  organization_id!: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ nullable: true })
  property_id?: number;

  @Column({ nullable: false })
  unit_type_code!: string;

  @Column({ nullable: false })
  unit_type_name!: string;

  @Column({ nullable: true })
  unit_class?: string;

  @Column({ nullable: true, type: "text" })
  description?: string;

  @Column({ nullable: true, type: "float4" })
  bathrooms?: number;

  @Column({ nullable: true, type: "integer" })
  bedrooms?: number;

  @Column({ nullable: true, type: "integer" })
  beds?: number;

  @Column({ nullable: false, default: true })
  status?: boolean;

  @ManyToMany(() => Amentity, (amentity) => amentity.unit_types)
  amenities!: Amentity[];

  @Column({ nullable: true, type: "jsonb" })
  images?: ImageDto[];

  @Column({ type: "jsonb", nullable: true })
  main_image?: any;

  @Column({ nullable: true, default: false })
  images_same_as_unit?: boolean;

  @OneToOne(() => UnitArea, (unitArea) => unitArea.unit_type)
  unit_area?: UnitArea;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization?: Organization;

  @ManyToOne(() => Property)
  @JoinColumn({ name: "property_id" })
  property?: Property;

  @Column({ nullable: true, type: "varchar", unique: true })
  pms_id?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
