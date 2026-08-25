import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { PaymentMethod, PaymentStatus } from './donation.entity';

/** 1:1 with a Participation row where type='sponsor'. A pledge against a
 * SponsorshipNeed. */
@Entity('sponsorship')
export class Sponsorship {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  participation_id!: string;

  @Column({ type: 'uuid' })
  sponsorship_need_id!: string;

  @Column({ type: 'decimal' })
  amount_pledged!: number;

  @Column({ type: 'varchar', default: 'pending' })
  payment_status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  payment_method?: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  receipt_number?: string;

  @Column({ type: 'uuid', nullable: true })
  recorded_by_user_id?: string;

  @Column({ type: 'timestamptz', nullable: true })
  recorded_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
