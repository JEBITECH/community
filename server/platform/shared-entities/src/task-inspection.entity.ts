
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
import { Team } from './team.entity';
import { Task } from './task.entity';
import { User } from './user.entity';
import { UnitArea } from './unit-area.entity';

@Entity()
export class TaskInspection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  task_id?: number;

  @ManyToOne(() => Task, (task) => task.task_inspection)
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ nullable: true })
  inspection_type?: string;

  @Column()
  unit_area_id?: number;

  @ManyToOne(() => UnitArea)
  @JoinColumn({ name: 'unit_area_id' })

  unit_area?: UnitArea;

  @ManyToMany(() => User, { nullable: true })
  @JoinTable({
    name: 'task_inspection_review__members',
    joinColumn: { name: 'task_inspection_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  team_members?: User[];

  @Column({ nullable: true })
  team_id?: number;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team?: Team;

  @Column({ nullable: true })
  inspection_rating?: number;

  @Column({ nullable: true })
  inspection_comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  inspection_comment_arr?: { comment: string }[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
