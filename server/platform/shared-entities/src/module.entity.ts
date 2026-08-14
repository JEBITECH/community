import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";

@Entity('module')
export class ModuleEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar' })
    name?: string;

    @Column({ type: 'boolean' })
    status?: boolean;

    @Column({ type: 'boolean', default: false })
    is_internal?: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt?: Date;

    @Column({ nullable: true })
    updatedBy?: number;

    @Column({ nullable: true })
    createdBy?: number;

    @ManyToMany(() => Organization, (organization) => organization.modules)
    organizations?: Organization[]
}