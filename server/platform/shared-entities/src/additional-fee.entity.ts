import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";

@Entity("guesty_additional_fee")
export class GuestyAdditionalFee {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pms_id!: string;

  @Column({ nullable: false })
  pms_acc_id!: number;

  @Column({ type: 'int4', nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({
    name: 'organization_id',
  })
  organization!: Organization;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  type!: string;

  @Column({ default: false })
  is_percentage!: boolean;

  @Column({ nullable: true })
  value!: number;

  @Column({ default: false })
  is_automated!: boolean;

  @Column({ nullable: true })
  multiplier?: string;

  @Column({ default: false })
  all_platforms?: boolean;

  @Column({ default: false })
  all_sources?: boolean;

  @Column({ default: false })
  is_deducted?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  channel_configurations?: any[];

  @Column({ type: 'jsonb', nullable: true })
  deducted_configuration?: any[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

}
