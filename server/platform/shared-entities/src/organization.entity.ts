import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ModuleEntity as Module } from "./module.entity";
import { Theme } from "./theme.entity";
import { OrganizationModuleSubscription } from "./organization-module-subscription.entity";

export type OrganizationType = 'society' | 'educational_institution';
export type OrganizationPlan = 'free' | 'community' | 'professional' | 'enterprise';
export type MembershipModel = 'open' | 'approval_required' | 'invite_only';
export type OrganizationStatus = 'pending' | 'active' | 'suspended';

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

  @Column({ type: 'varchar' })
  organization_type!: OrganizationType;

  @Column({ type: 'varchar', unique: true })
  subdomain!: string;

  @Column({ type: 'varchar', default: 'free' })
  plan!: OrganizationPlan;

  @Column({ type: 'varchar', default: 'approval_required' })
  membership_model!: MembershipModel;

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

  @Column({ type: 'varchar', nullable: true, default: 'pending' })
  organization_status!: OrganizationStatus;

  @Column({ type: 'text', nullable: true })
  organization_logo!: string;

  /**
   * List of domains allowed to use this organization's public embeds (e.g. a guest
   * registration widget). Empty array or null means no restriction. Reserved for
   * future custom-domain support — unused by the MVP subdomain-only flow.
   */
  @Column({ type: 'json', nullable: true, default: null })
  allowed_domains!: string[] | null;
}
