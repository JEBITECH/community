import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('audit_config')
export class AuditConfig {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    organization_id!: number;

    @Column()
    entity_name!: string;

    @Column({ default: false })
    log_insert!: boolean;

    @Column({ default: false })
    log_update!: boolean;

    @Column({ default: false })
    log_delete!: boolean;

    @Column({ default: false })
    enabled!: boolean;
}