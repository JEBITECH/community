import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index
} from "typeorm";

import { Property } from "./property.entity";
import { Checklist } from "./checklist.entity";

@Entity("guest_configs")
@Index("idx_guest_configs_property", ["property_id"])
@Index("idx_guest_configs_is_deleted", ["is_deleted"])
@Index("idx_guest_configs_property_is_deleted", ["property_id", "is_deleted"])

export class GuestConfig {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    property_id!: number;

    @ManyToOne(() => Property)
    @JoinColumn({ name: "property_id" })
    property!: Property;

    @Column({ type: "text", nullable: true })
    welcome_message?: string;

    @Column({ type: "text", nullable: true })
    qr_code_message?: string;

    @Column({ nullable: true })
    product_assign_to?: string;

    @Column({ nullable: true })
    product_priority?: string;

    @Column("simple-array", { nullable: true })
    product_emails?: string[];

    @Column({ nullable: true })
    product_task_type?: string;

    @Column({ nullable: true })
    product_checklist_id?: number;

    @ManyToOne(() => Checklist, { eager: true })
    @JoinColumn({ name: "product_checklist_id" })
    product_checklist?: Checklist;

    @Column({ nullable: true })
    issue_assign_to?: string;

    @Column({ nullable: true })
    issue_priority?: string;

    @Column("simple-array", { nullable: true })
    issue_emails?: string[];

    @Column({ nullable: true })
    issue_task_type?: string;

    @Column({ nullable: true })
    issue_checklist_id?: number;

    @ManyToOne(() => Checklist, { eager: true })
    @JoinColumn({ name: "issue_checklist_id" })
    issue_checklist?: Checklist;

    @Column({ nullable: true })
    feedback_email?: string;

    @Column({ type: "text", nullable: true })
    feedback_reply?: string;

    @Column({ type: "jsonb", nullable: true, default: () => "'[]'" })
    manager_contacts?: { name: string; contact: string; isDefault: boolean }[];

    @Column({ default: false })
    is_employee?: boolean;

    @Column({ default: false })
    is_customer?: boolean;

    @Column({ default: true })
    is_default_product_config?: boolean;

    @Column({ default: true })
    is_default_report_issue_config?: boolean;

    @Column({ default: false })
    is_deleted!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
