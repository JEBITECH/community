import { ApiProperty } from '@nestjs/swagger';
import { Inventory } from './inventory.entity';
import { Organization } from './organization.entity';
import { Property } from './property.entity';
import { UnitType } from './unit-type.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Amentity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int4", nullable: true })
  franchisee_id?: number | null;

  @Column({ nullable: true })
  @ApiProperty()
  code?: string;

  @Column()
  @ApiProperty()
  name!: string;

  @Column({ nullable: true })
  @ApiProperty()
  icon?: string;

  @Column({ nullable: true })
  @ApiProperty()
  photo?: string;

  @Column({ default: false })
  @ApiProperty()
  default!: boolean;

  @Column({ nullable: true, default: 0 })
  @ApiProperty({ default: 0 })
  count!: number;

  @Column({ default: true })
  @ApiProperty({ default: true })
  is_checklist_config!: boolean;

  @Column({ default: true })
  @ApiProperty({ default: true })
  is_guest_task_config!: boolean;

  @Column({ default: false })
  @ApiProperty()
  add_on!: boolean;

  @Column({ nullable: true })
  @ApiProperty()
  pms_id?: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
  @ApiProperty()
  organization!: Organization;

  @Column()
  @ApiProperty()
  organization_id!: number;

  @OneToMany(() => Inventory, (inventory) => inventory.amentity, {
    nullable: true,
  })
  @ApiProperty({ type: () => [Inventory] })
  inventories?: Inventory[];

  @Column({ nullable: true })
  @ApiProperty()
  status?: string;

  @ManyToMany(() => Property, (property) => property.amenities)
  properties?: Property[];

  @ManyToMany(() => UnitType, (unit_type) => unit_type.amenities)
  @JoinTable({
    name: 'unit_type_amenities_amentity',
    joinColumn: { name: 'amentity_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'unit_type_id',
      referencedColumnName: 'id',
    },
  })
  unit_types?: UnitType[];

  @CreateDateColumn()
  @ApiProperty()
  created_at?: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updated_at?: Date;
}
