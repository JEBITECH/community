import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('element_system_category')
export class ElementSystemCategory {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Auto-increment primary key' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, unique: true })
  @ApiProperty({ description: 'System category name (platform-level, unique)' })
  name!: string;


  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
