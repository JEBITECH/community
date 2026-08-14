import { ModuleEntity } from "@shared/entities";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('action')
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'boolean' })
  status?: boolean;

  @ManyToOne(() => ModuleEntity)
  @JoinColumn({ name: 'module_id', referencedColumnName: 'id' })
  module_master: ModuleEntity;

  @Column({ nullable: true })
  module_id?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  createdBy: number;



}