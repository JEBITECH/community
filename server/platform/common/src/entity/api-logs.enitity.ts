import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

@Entity('api_logs')
export class ApiLogs {

    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({ type: 'uuid', unique: true, nullable: false })
    request_id: string;

    @Column({ type: 'uuid', nullable: false, default: () => 'uuid_generate_v4()' })
    transaction_id?: string;

    @Column({ type: 'varchar', nullable: true })
    microservice_name: string;

    @Column({ type: 'varchar', nullable: true })
    method?: string;

    @Column({ type: 'varchar' })
    path: string;

    @Column({ type: 'int', nullable: true })
    status_code?: number;

    @Column({ type: 'int', nullable: true })
    response_timeMs?: number;

    @Column({ type: 'varchar', nullable: true })
    error_message?: string;

    @Column({ type: 'text', nullable: true })
    stack_trace?: string;

    @Column({ type: 'integer', nullable: true })
    organization_id?: number;

    @Column({
        type: 'timestamp',
        precision: 3,
        default: () => 'CURRENT_TIMESTAMP(3)',
        nullable: true,
    })
    created_at?: Date;

    @Column({ type: 'uuid', nullable: true })
    created_by?: string;

}
