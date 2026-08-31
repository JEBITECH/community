import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type BookingAttendeeType = 'self' | 'family' | 'other';

/**
 * One named attendee under a Booking — lets a single "Participate" booking
 * cover multiple people (self + family + others) instead of just a bare
 * seat count. `booking.seats_requested` is derived from the count of these
 * rows rather than being independently settable once attendees are used.
 */
@Entity('booking_attendee')
export class BookingAttendee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  booking_id!: string;

  @Column({ type: 'varchar' })
  attendee_type!: BookingAttendeeType;

  @Column({ type: 'varchar' })
  name!: string;

  // Optional link to an existing member (the PDF's "add membership id to
  // fetch the data") — when set, the attendee's name is resolved
  // server-side from that membership's user rather than trusted from the
  // client, same as the 'self' case.
  @Column({ type: 'uuid', nullable: true })
  membership_id?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
