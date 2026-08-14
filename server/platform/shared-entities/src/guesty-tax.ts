import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ValueType } from "./enums/value-type.enum";

@Entity()
export class GuestyTax {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", nullable: true })
    pms_id!: string;

    @Column({ type: "varchar", nullable: true })
    name?: string;

    @Column({ type: "enum", enum: ValueType, nullable: true })
    value_type?: ValueType;

    @Column({ type: "varchar", nullable: true })
    quantifier?: string;

    @Column({ type: "varchar", nullable: true })
    type?: string;

    @Column({ type: "int4", nullable: true })
    amount?: number;

    @Column({ type: "bool", nullable: false, default: false })
    applied_to_all_fees!: boolean;

    @Column({ type: "bool", nullable: false, default: false })
    is_applied_by_default!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    applied_on_fees?: any[];

    @Column({ type: 'jsonb', nullable: true })
    applied_by_default_on_channels?: any[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

}