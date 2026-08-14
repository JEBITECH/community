import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { PmsMaster } from './pms-master.entity';
import { PmsName } from './enums/pms-name.enum';
import { SyncStatusEnum } from './enums/sync-status.enum';
import { SyncType } from './enums/sync-type.enum';

@Entity('sync_statuses')
@Unique('UQ_sync_statuses_org_pms_type', ['organization_id', 'pms_id', 'sync_type'])
export class SyncStatus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
  organization!: Organization;

  @Column({ type: 'int' })
  pms_id!: number;

  @ManyToOne(() => PmsMaster)
  @JoinColumn({ name: 'pms_id', referencedColumnName: 'id' })
  pms_master!: PmsMaster;

  @Column({
    type: 'enum',
    enum: PmsName,
  })
  pms_name!: PmsName;

  @Column({
    type: 'enum',
    enum: SyncType,
  })
  sync_type!: SyncType;

  @Column({
    type: 'int',
    nullable: true,
  })
  first_sync_total_count?: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  first_sync_success_count?: number | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  first_sync_at?: Date | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  last_sync_total_count?: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  last_sync_success_count?: number | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  last_sync_at?: Date | null;

  @Column({
    type: 'enum',
    enum: SyncStatusEnum,
    default: SyncStatusEnum.Started,
  })
  status!: SyncStatusEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
