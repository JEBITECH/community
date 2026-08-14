import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";

@Entity("audit_logs")
@Check(`operation IN ('INSERT', 'UPDATE', 'REMOVE')`)
export class AuditLogs {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string;

  @Column({
    type: "uuid",
    nullable: false,
    default: () => "gen_random_uuid()",
  })
  request_id: string;


  @Column({ type: "uuid", nullable: true })
  user_id?: string;


  @Column({ type: "varchar" })
  entity_id: string;


  @Column({ type: "varchar" })
  entity_name: string;

  @Column({ type: "varchar", length: 10 })
  operation: "INSERT" | "UPDATE" | "REMOVE";

  @Column({ type: "jsonb", nullable: true })
  old_values?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  new_values?: Record<string, any>;

  @Column({
    type: "uuid",
    nullable: false,
    default: () => "uuid_generate_v4()",
  })
  transaction_id: string;

  @Column({ type: 'integer', nullable: true })
  organization_id?: number;

  @Column({
    type: "timestamp",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
    nullable: true,
  })
  created_at?: Date;
}
