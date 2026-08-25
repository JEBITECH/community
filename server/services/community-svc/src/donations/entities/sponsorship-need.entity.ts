import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type SponsorshipNeedStatus = 'open' | 'fulfilled' | 'closed';

/** Admin-defined sponsorship opportunity (e.g. "Prasad Sponsorship — ₹20,000"),
 * distinct from a member's pledge against it (Sponsorship). */
@Entity('sponsorship_need')
export class SponsorshipNeed {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid' })
  event_id!: string;

  @Column({ type: 'uuid', nullable: true })
  event_component_id?: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal' })
  target_amount!: number;

  @Column({ type: 'decimal', default: 0 })
  amount_raised!: number;

  @Column({ type: 'varchar', default: 'open' })
  status!: SponsorshipNeedStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
