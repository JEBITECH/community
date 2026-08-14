import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('guesty_quotation')
export class GuestyQuotation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  quotation_id?: string;

  @Column({ type: 'date', nullable: true })
  checkInDate?: string;

  @Column({ type: 'date', nullable: true })
  checkOutDate?: string;

  @Column({ type: 'int4', default: 1 })
  guestCount!: number;

  @Column({ nullable: false })
  listingId!: string;

  @Column({ type: 'jsonb', nullable: true })
  quotationResponse?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  invoiceItem?: any[];

  @Column({ type: 'int4' })
  organizationId!: number;

  @Column({ type: 'int4', nullable: true })
  pmsId?: number;

  @Column({ type: 'jsonb', nullable: true })
  numberOfGuests?: {
    numberOfAdults: number;
    numberOfChildren: number;
    numberOfInfants: number;
    numberOfPets: number;
  };

  @Column({ type: 'varchar', nullable: true })
  inquiryId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
