import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('booking')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  participation_id!: string;

  @Column({ type: 'int', default: 1 })
  seats_requested!: number;

  @Column({ type: 'date', nullable: true })
  booking_date?: string;

  @Column({ type: 'time', nullable: true })
  slot_start?: string;

  @Column({ type: 'time', nullable: true })
  slot_end?: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at?: Date | null;

  @Column({ type: 'text', nullable: true })
  cancel_reason?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
