import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { CountObj } from './dto/task/count.dto';

@Entity()
export class TaskInventory {
  @PrimaryGeneratedColumn()
  id!: number;

  // @OneToMany(() => Inventory, (inventory) => inventory.task_inventory, {
  //   nullable: true,
  // })
  // inventories: Inventory[];

  @Column({ type: "int4", nullable: false })
  task_id!: number;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ type: 'jsonb', nullable: true })
  countObj?: CountObj[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
