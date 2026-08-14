import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { ModuleEntity as Module } from "./module.entity";

export type TermType = "short" | "long";

@Entity("organization_module_subscription")
export class OrganizationModuleSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Organization, (org) => org.moduleSubscriptions, { onDelete: "CASCADE" })
  organization!: Organization;

  @ManyToOne(() => Module, { eager: true })
  module!: Module;

  @Column({ type: "varchar", default: "short" })
  term!: TermType;

  @Column({ type: "decimal", default: 0 })
  price!: number;

  @Column({ type: "date" })
  startDate!: string;

  @Column({ type: "date" })
  endDate!: string;
}