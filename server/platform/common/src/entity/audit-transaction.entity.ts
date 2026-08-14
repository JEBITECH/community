import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity('audit_transaction')
export class AuditTransaction {

    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({ type: 'uuid', unique: true, nullable: false, default: () => 'uuid_generate_v4()' })
    transaction_id: string;

    @Column({ type: 'int', nullable: true })
    organization_id: number;


    @Column({ type: 'uuid', nullable: true })
    user_id?: string;


    @Column({ type: 'varchar', nullable: true })
    session_id: string;


    @Column({ type: 'varchar', nullable: true })
    transaction_type?: string;

    @Column({
        type: 'timestamp',
        precision: 3,
        default: () => 'CURRENT_TIMESTAMP(3)',
        nullable: true,
    })
    started_at?: Date;

    @Column({
        type: 'timestamp',
        precision: 3,
        default: () => 'CURRENT_TIMESTAMP(3)',
        nullable: true,
    })
    ended_at?: Date;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        enumName: 'transaction_status_enum',
    })
    transaction_status: TransactionStatus;

    @Column({ type: 'boolean' })
    enable_logging: boolean;


}
