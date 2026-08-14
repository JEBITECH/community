
import { Property } from './property.entity';
import { Unit } from './unit.entity';
import { NormalizedReservation } from './normalized-reservation';
// import { ReservationFolio } from './reservationfolio.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class OwnerSettlementComputation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    reservation_id?: number;

    @ManyToOne(() => NormalizedReservation)
    @JoinColumn({ name: 'reservation_id', referencedColumnName: 'id' })
    reservation?: NormalizedReservation;

    @Column({ nullable: true })
    unit_id?: number;

    // @Column({ nullable: true })
    // reservation_folio_id: number;

    // @ManyToOne(() => ReservationFolio)
    // @JoinColumn({ name: 'reservation_folio_id', referencedColumnName: 'id' })
    // reservationfolio: ReservationFolio;

    @ManyToOne(() => Unit)
    @JoinColumn({ name: 'unit_id', referencedColumnName: 'id' })
    unit?: Unit;

    @Column({ type: 'jsonb', nullable: true })
    Add_ons?: {
        [key: string]: {
            pms_name: string;
            product_name: string;
            product_id: number;
            pms_id: number;
            value: number;
            per_day_price?: number;
            product_category: string;
        }[];
    };

    @Column({ type: 'jsonb', nullable: true })
    Difference_Add_ons?: {
        [category: string]: (
            | {
                type: 'new_category';
                products: {
                    pms_name: string;
                    product_name: string;
                    product_id: number;
                    pms_id: number;
                    value: number;
                    per_day_price?: number;
                    product_category: string;
                }[];
            }
            | {
                type: 'new_product' | 'value_updated';
                product_name: string;
                product_id: number;
                pms_name: string;
                pms_id: number;
                value: number;
                per_day_price?: number;
                product_category: string;
                old_value?: number;
                new_value?: number;
            }
        )[];
    };


    @Column({ name: "arrival_date", nullable: true })
    arrivalDate?: string;

    @Column({ name: "departure_date", nullable: true })
    departureDate?: string;

    @Column({ nullable: true })
    nights?: number;

    @Column({ type: 'jsonb', nullable: true })
    calculation?: {
        [month: string]: string[];
    }[];

    @Column({ type: 'jsonb', nullable: true })
    month_wise_amount?: {
        [month: string]: {
            basevalue: number;
            owner_payout: number;
            prpty_mngmt_payout: number;
            included_amount: number;
            excluded_amount: number;
            avg_Price_for_each_day_for_unit_or_bill_amount: number,
            Total_nights_in_month: number,
            unit_value_or_bill_amount_value: number
        };
    };

    @Column({ type: 'boolean', default: false })
    modified_reservation_calculation?: boolean

    @Column({ type: 'boolean', default: false })
    isoverlappingreservation?: boolean

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    owner_amount?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    prpty_mngmt_amount?: number;

    @Column({ type: 'text', array: true, nullable: true })
    Difference_reason?: string[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}