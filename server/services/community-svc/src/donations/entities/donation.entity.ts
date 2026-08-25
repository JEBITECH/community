import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type DonationPurpose = 'event' | 'component' | 'general';
export type PaymentStatus = 'pending' | 'recorded' | 'failed';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

/** 1:1 with a Participation row where type='donate'. */
@Entity('donation')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  participation_id!: string;

  @Column({ type: 'decimal' })
  amount!: number;

  @Column({ type: 'varchar', default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', default: 'event' })
  purpose!: DonationPurpose;

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
