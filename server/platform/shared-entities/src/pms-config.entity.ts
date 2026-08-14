import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { PMSCredentialsDto } from "./dto/pms-credentials.dto";
import { PmsMaster } from "./pms-master.entity";
import { AuthType } from "./enums/authtype.num";

@Entity("pms_config")
export class PmsConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  baseUrl!: string;

  @Column({ type: "varchar" })
  authType!: AuthType;

  @Column({ type: "boolean", default: false })
  is_archived!: boolean;

  @Column({ type: "varchar", nullable: true })
  authUrl?: string;

  @Column({ type: "jsonb", nullable: true })
  credentials!: PMSCredentialsDto;

  @Column({ type: "varchar", nullable: true })
  apiKey!: string;

  @Column({ nullable: true, name: 'bearer_token' })
  bearerToken!: string;

  @Column({ nullable: true, name: 'bearer_token_expiry' })
  bearerTokenExpiry!: Date;

  @Column({ type: "jsonb" })
  endpoints!: Record<string, string>;

  @Column({ type: "jsonb" })
  fields!: Record<string, string[]>;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id", referencedColumnName: "id" })
  organization!: Organization;

  @Column()
  organization_id!: number;

  @ManyToOne(() => PmsMaster)
  @JoinColumn({ name: 'pms_id', referencedColumnName: 'id' })
  pmsMaster!: PmsMaster;

  @Column()
  pms_id!: number;
}