import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from './organization.entity';
import { Inventory } from './inventory.entity';
import { Status } from './enums/status.enum';
import { ElementType } from './enums/element-type.enum';

@Entity('element')
@Unique('uq_element_org_property_area_name', ['organization_id', 'property_id', 'area_type', 'name'])
export class Element {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Auto-increment primary key' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, unique: true })
  @ApiProperty({ description: 'Unique element code' })
  code!: string;

  @Column({ type: 'varchar', nullable: false })
  @ApiProperty({ description: 'Element display name' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ description: 'Element description' })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiPropertyOptional({ description: 'Photo URL' })
  photo?: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ description: 'Instructions for guests on how to use this amenity' })
  usage_instructions?: string | null;

  @Column({ type: 'text', array: true, nullable: false, default: () => "'{}'" })
  @ApiPropertyOptional({ description: 'Uploaded image/video file paths for this amenity', type: [String], default: [] })
  media!: string[];

  @Column({ nullable: false, default: false })
  @ApiProperty({ description: 'Default element flag', default: false })
  default!: boolean;

  @Column({ type: 'int', nullable: true, default: 0 })
  @ApiProperty({ description: 'Stock count', default: 0 })
  count!: number;

  @Column({ nullable: false, default: true })
  @ApiProperty({ description: 'Show on checklist', default: true })
  is_checklist_config!: boolean;

  @Column({ nullable: false, default: true })
  @ApiProperty({ description: 'For guest task', default: true })
  is_guest_task_config!: boolean;

  @Column({ nullable: false, default: false })
  @ApiProperty({ description: 'Show on maintenance task', default: false })
  is_maintenance_task_config!: boolean;

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({ description: 'Property ID this element is scoped to' })
  property_id?: number | null;

  @Column({ type: 'int', array: true, nullable: false, default: () => "'{}'" })
  @ApiPropertyOptional({ description: 'Unit IDs (empty = all units of the property)', type: [Number], default: [] })
  unit_ids!: number[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiPropertyOptional({ description: 'Area type this element is scoped to (e.g. bedroom, kitchen)' })
  area_type?: string | null;

  @Column({ type: 'int', nullable: false })
  @ApiProperty({ description: 'Organization ID (tenant isolation)' })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  @ApiPropertyOptional({ type: () => Organization })
  organization?: Organization;

  @Column({ type: 'varchar', nullable: false, default: Status.Active })
  @ApiProperty({ description: 'Lifecycle state', default: Status.Active })
  status!: string;

 

  @Column({ type: 'text', array: true, nullable: false, default: () => "'{}'" })
  @ApiPropertyOptional({ description: 'Element categories (multi-select)', type: [String], default: [] })
  element_types!: string[];

  @Column({ type: 'text', array: true, nullable: false, default: () => "'{}'" })
  @ApiPropertyOptional({ description: 'Element sub-categories (multi-select)', type: [String], default: [] })
  element_sub_types!: string[];

  @OneToMany(() => Inventory, (inventory) => inventory.element)
  @ApiPropertyOptional({ type: () => [Inventory] })
  inventories?: Inventory[];

  @Column({ nullable: true })
  @ApiProperty()
  pms_id?: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  created_at!: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updated_at!: Date;
}
