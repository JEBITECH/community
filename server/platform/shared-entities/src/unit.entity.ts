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
import { ImageDto } from "./dto/image.dto";
import { Property } from "./property.entity";
import { NotesDto } from "./dto/note.dto";
// import { RawOwnerships } from "./raw-ownerships";
import { UnitAddress } from "./unit-address.entity";
import { UnitType } from "./unit-type.entity";
import { Organization } from "./organization.entity";
import { HouseRulesDto } from "./dto/House-rules.dto";
import { LocalEatsDto } from "./dto/local-eats.dto";
import { ApplianceInstructionsDto } from "./dto/appliance-instructions.dto";
import { PropertyQuirksDto } from "./dto/property-quirks.dto";
import { SafetyTipsDto } from "./dto/safety-tips.dto";
import { DirectionInstructionsDto } from "./dto/direction-instructions.dto";
import { RawListings } from "./raw-listings";
import { UnitCost } from "./unit-cost.entity";
import { Template } from "./template.entity";
import { User } from "./user.entity";
import { OwnerFormula } from "./owner-formula.entity";
import { Inventory } from "./inventory.entity";
import { OwnerGroup } from "./ownergroup.entity";
import { Task } from "./task.entity";
import { ChargesUnitsMapping } from "./charges_units_mapping.entity";
import { Entry } from "./manual.entries.entity";
import { FormulaUnitLink } from "./formula-unit-link.entity";
import { UnitCondition } from "./enums/unit-condition.enum";
@Entity()
export class Unit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int4", nullable: true })
  address_id?: number;

  @Column({ nullable: false, default: true })
  address_same_as_property!: boolean;

  @Column({ nullable: true })
  checkin_instructions?: string;

  @Column({ nullable: true })
  departure_instructions?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  emergency_contact?: string;

  @Column({ type: "jsonb", nullable: true })
  images?: ImageDto[];

  @Column({ type: "jsonb", nullable: true })
  firebase_images?: any[];

  @Column({ nullable: false, default: false })
  images_same_as_unittype?: boolean;

  @Column({ type: "jsonb", nullable: true })
  main_image?: ImageDto;

  @Column({ type: "jsonb", nullable: true })
  notes?: NotesDto;

  @Column()
  organization_id!: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ nullable: true })
  parking_instructions?: string;

  @Column({ nullable: true, type: "varchar", unique: true })
  pms_id?: string;

  @OneToOne(() => RawListings, listing => listing.unit, {
    nullable: true
  })
  @JoinColumn({ name: "pms_id", referencedColumnName: "pms_id" })
  listing!: RawListings;

  @Column({ nullable: true })
  property_id?: number;

  @Column({ nullable: true })
  status?: boolean;

  @Column({ nullable: true })
  unit_code?: string;

  @Column({
    enum: UnitCondition,
    nullable: true
  }) unit_condition!: string;

  @Column({ nullable: false })
  unit_name!: string;

  @Column({ nullable: true })
  unit_type_id!: number;

  @Column({ type: "int2", nullable: true })
  minimum_age?: number;

  @Column({ nullable: true, type: "varchar" })
  directions!: string;

  @Column({ nullable: true, type: "varchar" })
  guest_access!: string;

  @Column({ type: "jsonb", nullable: true })
  house_rules!: HouseRulesDto[];

  @Column({ type: "jsonb", nullable: true })
  local_eats!: LocalEatsDto[];

  @Column({ type: "jsonb", nullable: true })
  appliance_instructions!: ApplianceInstructionsDto[];

  @Column({ type: "jsonb", nullable: true })
  property_quirks!: PropertyQuirksDto[];

  @Column({ type: "jsonb", nullable: true })
  safety_tips!: SafetyTipsDto[];

  @Column({ type: "jsonb", nullable: true })
  directions_instructions!: DirectionInstructionsDto[];

  @ManyToOne(() => UnitType)
  @JoinColumn({ name: "unit_type_id", referencedColumnName: "id" })
  unitType!: UnitType;

  @ManyToOne(() => Property)
  @JoinColumn({ name: "property_id" })
  property?: Property;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @JoinColumn({ name: "address_id" })
  @OneToOne(() => UnitAddress, { cascade: true })
  address?: UnitAddress;

  // @OneToMany(() => RawOwnerships, (ownerships) => ownerships.rawListing, {
  //   cascade: ["insert", "update"],
  //   onDelete: "CASCADE",
  // })
  // ownerShips!: RawOwnerships[];
  @OneToMany(() => Task, (task) => task.unit)
  tasks!: Task[];

  @CreateDateColumn({ nullable: false })
  created_at!: Date;

  @UpdateDateColumn({ nullable: false })
  updated_at!: Date;

  @Column({ nullable: true })
  ownergroup_id?: number;

  @ManyToOne(() => OwnerGroup, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownergroup_id', referencedColumnName: 'id' })
  ownergroup?: OwnerGroup;

  @OneToMany(() => UnitCost, (unitCost) => unitCost.unit)
  unitCosts?: UnitCost[];

  @ManyToMany(() => Template, (template) => template.units)
  @JoinTable()
  templates?: Template[];

  @Column({ type: "int4", nullable: true })
  ownerformula_id?: number | null;

  @ManyToOne(() => OwnerFormula, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerformula_id', referencedColumnName: 'id' })
  ownerformula?: OwnerFormula;

  @OneToMany(() => Inventory, (inventory) => inventory.unit, { nullable: true })
  inventories?: Inventory[];

  @OneToMany(() => ChargesUnitsMapping, (mapping) => mapping.unit, { nullable: true })
  chargesMapping?: ChargesUnitsMapping[];

  @OneToMany(() => Entry, (entry) => entry.unit, { nullable: true })
  entries?: Entry[];

  @Column({ type: 'varchar', nullable: true })
  current_owner_id?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'current_owner_id' })
  current_owner?: User;

  @Column({ type: 'int4', nullable: true })
  current_ownerformula_id?: number | null;

  @ManyToOne(() => OwnerFormula, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_ownerformula_id' })
  current_ownerformula?: OwnerFormula;

  @Column({ nullable: true })
  lat?: string;

  @Column({ nullable: true })
  lng?: string;


  @OneToMany(
    () => FormulaUnitLink,
    (formulaUnitLink) => formulaUnitLink.unit
  )
  formulaUnitLinks?: FormulaUnitLink[];

  @Column({ type: 'jsonb', nullable: true })
  dateRanges?: [];
}
