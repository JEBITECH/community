import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from './organization.entity';

@Entity('element_category')
export class ElementCategory {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Auto-increment primary key' })
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  @ApiProperty({ description: 'Subcategory name' })
  name!: string;



  @Column({ type: 'varchar', nullable: false })
  @ApiProperty({ description: 'System category this subcategory belongs to (Amenities, Inventories, Products)' })
  parent_category!: string;

  @Column({ type: 'int', nullable: false })
  @ApiProperty({ description: 'Organization ID (tenant isolation)' })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  @ApiPropertyOptional({ type: () => Organization })
  organization?: Organization;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  created_at!: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updated_at!: Date;
}
