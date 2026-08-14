import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { Status } from "./enums/status.enum";
import { Inventory } from "./inventory.entity";
import { PmsMaster } from "./pms-master.entity";
import { AddonFeeType } from "./enums/Addonfee-type.enum";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  user_comment?: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  pms_id?: string;

  @Column({ nullable: true })
  fee_plan_id?: number;

  @Column({ nullable: true })
  product_type?: string;
  //product_type: ProductType; //to be checked in product services and add this enum 

  @Column({ nullable: true })
  photo?: string;

  @Column({ nullable: false, default: false })
  default!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  count?: number;

  @Column({ nullable: false, default: true })
  is_checklist_config!: boolean;

  @Column({ nullable: false, default: true })
  is_guest_task_config!: boolean;

  @Column({ type: "int4", nullable: true })
  pms_acc_id?: number;

  @ManyToOne(() => PmsMaster)
  @JoinColumn({ name: "pms_acc_id", referencedColumnName: "id" })
  pms_master!: PmsMaster;

  @Column()
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @OneToMany(() => Inventory, (inventory) => inventory.product, {
    nullable: true,
  })
  inventories?: Inventory[];

  @Column({ type: "enum", enum: Status, nullable: false, default: Status.Active })
  status!: Status;

  @Column({ type: "enum", enum: AddonFeeType, nullable: true, })
  apply_fee_type?: AddonFeeType;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  fee_per_day?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
