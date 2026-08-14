import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Action } from "./action.model";
import { ModuleEntity } from "@shared/entities";

@Entity('sub_action')
export class SubAction {
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

    @ManyToOne(() => Action)
    @JoinColumn({ name: 'action_id', referencedColumnName: 'id' })
    action_master: ModuleEntity;

    @Column({ nullable: true })
    action_id?: number;


    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({ nullable: true })
    updatedBy: number;

    @Column({ nullable: true })
    createdBy: number;


}