import { Organization } from "@shared/entities";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('roles')
export class Roles {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'boolean' })
    status?: boolean;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
    organization: Organization;

    @Column({ nullable: true })
    organization_id?: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({ nullable: true })
    updatedBy: number;

    @Column({ nullable: true })
    createdBy: number;


}