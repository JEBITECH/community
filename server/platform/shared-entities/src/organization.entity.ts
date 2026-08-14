import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ModuleEntity as Module } from "./module.entity";
import { Theme } from "./theme.entity";
import { PmsConfig } from "./pms-config.entity";
import { OrganizationModuleSubscription } from "./organization-module-subscription.entity";
import { Generated } from "typeorm";
export interface PropertyLocation {
  property_name: string;
  property_location: string;
}

@Entity('organization')
export class Organization {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'uuid',
    unique: true,
    default: () => 'uuid_generate_v4()'
  })
  uuid!: string;

  @Column({ type: 'varchar' })
  organization_name!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  organization_email!: string;

  @Column({ type: 'varchar' })
  organization_location!: string;

  @Column({ type: 'varchar', nullable: true, default: 'UTC' })
  organization_timezone!: string;

  @Column({ type: 'varchar', nullable: true })
  organization_contact_info!: string;

  @Column({ type: 'json', nullable: true })
  organization_property_locations!: PropertyLocation[];

  @Column({ type: "boolean", default: false })
  is_archived!: boolean;

  @ManyToMany(() => Module, (module) => module.organizations)
  @JoinTable({
    name: 'organization_modules',
    joinColumn: {
      name: 'organization_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'module_id',
      referencedColumnName: 'id',
    },
  })
  modules!: Module[]

  @OneToMany(() => OrganizationModuleSubscription, (sub) => sub.organization, { cascade: true })
  moduleSubscriptions!: OrganizationModuleSubscription[];

  @OneToOne(() => Theme, (theme) => theme.organization, { cascade: true })
  @JoinColumn({ name: 'theme_config_id' })
  themeConfig!: Theme;

  @OneToMany(() => PmsConfig, (pmsConfig) => pmsConfig.organization)
  pmsConfigs!: PmsConfig[];


  @Column({ type: 'varchar', nullable: true, default: 'pending' })
  organization_status!: string

  @Column({ type: 'text', nullable: true })
  organization_logo!: string;

  @Column({ type: 'boolean', default: false })
  is_franchisor!: boolean;

  @Column({ type: 'int', nullable: true })
  parent_org_id!: number | null;

  /**
   * List of domains allowed to use this organization's booking widget embed.
   * When set, the public-access-token will only be issued if the request
   * Origin/Referer matches one of these domains.
   * Empty array or null means no restriction (allow all — useful for development).
   * 
   * Example: ["thegrandhotel.com", "www.thegrandhotel.com", "booking.thegrandhotel.com"]
   */
  @Column({ type: 'json', nullable: true, default: null })
  allowed_domains!: string[] | null;
}