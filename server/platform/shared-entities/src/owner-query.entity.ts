import { ApiProperty } from '@nestjs/swagger';
import { Task } from './task.entity';
import { User } from './user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class OwnerQuery {
    @PrimaryGeneratedColumn()
    @ApiProperty()
    id!: number;

    @Column()
    @ApiProperty()
    comment!: string;

    @Column({ nullable: true })
    @ApiProperty()
    sender_id?: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_id' })
    @ApiProperty({ type: () => User })
    sender?: User;

    @Column({ nullable: true })
    @ApiProperty()
    task_id?: number;

    @ManyToOne(() => Task, (task) => task.owner_querries)
    @JoinColumn({ name: 'task_id', referencedColumnName: 'id' })
    @ApiProperty({ type: () => Task })
    task?: Task;

    @Column({ default: false })
    @ApiProperty({ default: false })
    is_for_allusers!: boolean;

    @CreateDateColumn()
    @ApiProperty()
    created_at!: Date;

    @UpdateDateColumn()
    @ApiProperty()
    updated_at!: Date;

    @Column({ default: false })
    @ApiProperty({ default: false })
    is_query!: boolean;
}
