import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RawOwnerships } from "./raw-ownerships";
import { dataProcessingStatus } from "./enums/DATA_PROCESSING_STATUS.enum";

@Entity("raw_owners")
export class RawOwners {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  pms_id!: string;

  @Column({ nullable: true })
  pms_acc_id?: number;

  @Column({ nullable: true })
  organization_id?: number;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: false, default: false })
  active!: boolean;

  @OneToMany(() => RawOwnerships, (ownership) => ownership.rawOwner, {
    cascade: ['insert', 'update']
  })
  rawOwnerships?: RawOwnerships[];

  @Column({ type: "jsonb", nullable: true, name: "raw_json_data" })
  rawJsonData?: any;

  @Column({
    default: dataProcessingStatus.PENDING,
    type: "enum",
    enum: dataProcessingStatus,
    nullable: false
  })
  status?: dataProcessingStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
