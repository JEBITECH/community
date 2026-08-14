import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AreaType } from './enums/area-type.enum';
import { Status } from './enums/status.enum';
import { Organization } from './organization.entity';
import { TaskInventory } from './task-inventory.entity';
import { Image } from './dto/task/image.dto';
import { Unit } from './unit.entity';
import { Product } from './product.entity';
import { Element } from './element.entity';
import { Amentity } from './amentity.entity';

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false, unique: true })
  code!: string;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @Column({ type: "int4", nullable: true })
  quantity?: number;

  @Column({ type: "varchar", nullable: true })
  image_url?: string;

  @Column({ type: "varchar", nullable: true })
  video_url?: string;

  @Column({ type: "varchar", nullable: true })
  doc_url?: string;

  @Column({ type: "bool", nullable: false, default: false })
  default!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  images?: Image[];

  @Column({ type: "decimal", nullable: false, precision: 10, scale: 2, default: 0.0 })
  price!: number;

  @Column({ type: "int4", nullable: true })
  unit_id?: number;

  @ManyToOne(() => Unit, (unit) => unit.inventories)
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @Column({ type: "int4", nullable: true })
  task_inventory_id?: number;

  @ManyToOne(() => TaskInventory)
  @JoinColumn({ name: 'task_inventory_id' })
  task_inventory?: TaskInventory;

  @Column({ nullable: true })
  cat_element_id?: number;

  @ManyToOne(() => Element, (element) => element.inventories)
  @JoinColumn({ name: 'cat_element_id' })
  element?: Element;

  @Column({ nullable: true })
  cat_amentity_id?: number;

  // uncomment when Amentity module is ready

  @ManyToOne(() => Amentity, (amentity) => amentity.inventories)
  @JoinColumn({ name: 'cat_amentity_id' })
  amentity?: Amentity;

  @Column({ type: "int4", nullable: true })
  cat_product_id?: number;

  @ManyToOne(() => Product, (product) => product.inventories)
  @JoinColumn({ name: 'cat_product_id' })
  product?: Product;

  @Column({ type: "int4", nullable: false })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ type: 'enum', nullable: false, enum: Status, default: Status.Active })
  status!: Status;

  @Column({ nullable: true })
  comment?: string;

  @Column({ type: 'enum', enum: AreaType, nullable: true })
  area_type?: AreaType;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
