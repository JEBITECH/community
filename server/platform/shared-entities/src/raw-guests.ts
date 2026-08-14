import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RawReservation } from "./raw-reservation";
import { dataProcessingStatus } from "./enums/DATA_PROCESSING_STATUS.enum";

@Entity()
export class RawGueust {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  pms_id!: string;

  @Column({ nullable: true })
  pms_acc_id?: number;

  @Column({ nullable: true })
  organization_id?: number;

  @Column({ nullable: true })
  pms_mapping_id?: number;

  @Column({ nullable: true })
  accountId?: string;

  @Column({ nullable: true })
  isAuthZ?: boolean;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: "jsonb", nullable: true })
  emails?: any[];

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ type: "jsonb", nullable: true })
  tags?: any[];

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: "jsonb", nullable: true })
  phones?: any[];

  @Column({ type: "jsonb", nullable: true })
  roles?: any[];

  @Column({ type: "jsonb", nullable: true })
  favs: any;

  @Column({ type: "jsonb", nullable: true })
  settings: any;

  @Column({ type: "jsonb", nullable: true, name: "raw_json_data" })
  rawJsonData: any;

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

  @OneToMany(() => RawReservation, (res) => res.rawGuest)
  reservations?: RawReservation[];
}
