import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "@shared/entities";

export enum GHBUnitIssueStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

@Entity({ name: "ghb_reported_issues" })
@Index("idx_ghb_reported_issues_org_id", ["organizationId"])
@Index("idx_ghb_reported_issues_reservation_id", ["reservationId"])
export class GHBReportedIssue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "organization_id" })
  organizationId?: number;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ name: "reservation_id", nullable: true })
  reservationId?: string;

  @Column({ name: "issue_description", type: "text" })
  issueDescription?: string;

  @Column({ name: "status", enum: GHBUnitIssueStatus, default: GHBUnitIssueStatus.NEW })
  status!: GHBUnitIssueStatus;

  @Column({ name: "image_url", type: "jsonb", nullable: true, default: [] })
  imageUrl?: string[];

  @Column({ name: "assigned_user", type: "varchar", nullable: true })
  assignedUser?: string | null;

  @Column({ name: "priority", type: "varchar", nullable: true })
  priority?: string | null;

  @Column({ name: "notification_emails", type: "jsonb", nullable: true, default: [] })
  notificationEmails?: string[];

  @Column({ name: "employee_access", type: "boolean", default: false })
  employeeAccess!: boolean;

  @Column({ name: "customer_access", type: "boolean", default: false })
  customerAccess!: boolean;

  @Column({ name: "manual_configuration", type: "boolean", default: false })
  manualConfiguration!: boolean;

  @Column({ name: "is_guest_issues", type: "boolean", default: false })
  isGuestIssues!: boolean;

  @Column({ name: "approval_status", type: "varchar", default: "AUTO_APPROVED" })
  approvalStatus!: string;

  @Column({ name: "task_id", type: "int", nullable: true })
  taskId?: number | null;

  @Column({ name: "created_by", type: "varchar", nullable: true })
  createdBy?: string | null;

  @Column({ name: "updated_by", type: "varchar", nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
