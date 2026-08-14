
import { Property } from './property.entity';
import { Unit } from './unit.entity';
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
export class UnitLock {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    property_id?: number;

    @ManyToOne(() => Property)
    @JoinColumn({ name: 'property_id', referencedColumnName: 'id' })
    property?: Property;

    @Column({ nullable: true })
    unit_id?: number;

    @ManyToOne(() => Unit)
    @JoinColumn({ name: 'unit_id', referencedColumnName: 'id' })
    unit?: Unit;

    @Column({ name: "lock_Start_Date", nullable: true })
    lock_start_date?: string;

    @Column({ name: "lock_End_Date", nullable: true })
    lock_End_Date?: string;

    @Column({ name: "TotalNights", default: 0 })
    TotalNights!: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}