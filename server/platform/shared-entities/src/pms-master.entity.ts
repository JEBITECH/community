import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Organization } from "./organization.entity";
import { PmsConfig } from "./pms-config.entity";

@Entity('pms_master')
@Unique('UQ_pms_master_pms_account_id', ['pms_account_id'])
export class PmsMaster {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    pms_name?: string;

    @Column({ type: "boolean", default: false })
    is_archived!: boolean;

    @Column({ type: 'varchar' })
    pms_location?: string;

    @Column({ type: 'varchar', nullable: true })
    pms_account?: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    pms_account_id?: string;

    @Column({ type: 'varchar', default: '' })
    pms_url?: string

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
    organization!: Organization;

    @Column({ nullable: true, type: 'integer' })
    organization_id?: number;

    @OneToMany(() => PmsConfig, (pmsConfig) => pmsConfig.pmsMaster)
    pmsConfigs!: PmsConfig[];
}