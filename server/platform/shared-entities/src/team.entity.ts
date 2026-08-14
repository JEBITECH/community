
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Property } from './property.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  team_name?: string;

  @Column({ nullable: true })
  team_code?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  team_leader_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'team_leader_id' })
  team_leader?: User;

  @Column({ nullable: true })
  property_id?: number;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @ManyToMany(() => User, { nullable: true })
  @JoinTable({
    name: 'team_members',
    joinColumn: { name: 'team_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  team_members?: User[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
