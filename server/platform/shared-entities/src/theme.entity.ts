import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";

@Entity('theme')
export class Theme {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', default:'#000000' })
    primary_color!: string;

    @Column({ type: 'varchar', default:'#ffffff' })
    secondary_color!: string;

    @Column({ type: 'varchar', default:'Arial' })
    font_family!: string;

    @OneToOne(() => Organization, (organization) => organization.themeConfig)
    organization!: Organization;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt?: Date;

    @Column({ nullable: true })
    updatedBy?: number;

    @Column({ nullable: true })
    createdBy?: number;
}