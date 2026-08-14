
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

import { NormalizedReservation } from './normalized-reservation';

@Entity('guests')
// @Index(['email'], { unique: true })
export class Guest {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column({ nullable: true })
    title?: string;

    @Column()
    first_name!: string;

    @Column()
    last_name!: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth?: Date;


    @Column({ nullable: true })
    street?: string; //make migration for nullable

    @Column({ nullable: true })
    house_number?: string;

    @Column({ nullable: true })
    house_number_suffix?: string;

    @Column({ nullable: true })
    postal_code?: string;

    @Column({ nullable: true })
    city?: string;

    @Column({ nullable: true })
    country?: string;


    @Column({ nullable: true })
    email?: string;

    @Column("text", {
        array: true,
        nullable: true,
        default: () => "'{}'",
    })
    emails?: string[];

    @Column({ nullable: true })
    phone_number?: string; //make migration for nullable

    @Column({ nullable: true })
    mobile_number?: string;


    @Column({ nullable: true })
    comments?: string;


    @Column({ default: false })
    is_primary!: boolean;

    @ManyToOne(() => Guest, { nullable: true })
    @JoinColumn({ name: 'parent_guest_id' })
    parent_guest?: Guest;


    @ManyToMany(() => NormalizedReservation, reservation => reservation.guests)
    reservations?: NormalizedReservation[];

    @Column({ unique: true, nullable: true })
    pms_id?: string;

    @Column({ nullable: false, default: false })
    is_returning_guest!: boolean;

    @Column({ nullable: true })
    organization_id?: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}