import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('travel_party')
export class TravelParty {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  reservation_pms_id!: string;

  @Column({ type: 'varchar', nullable: true })
  guest_pms_id?: string;

  @Column({ type: 'int', nullable: true })
  reservation_id?: number;

  @Column({ type: 'int', nullable: true })
  guest_id?: number;

  @Column({ type: 'int', nullable: false })
  organization_id!: number;

  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @Column({ type: 'varchar', nullable: false })
  first_name!: string;

  @Column({ type: 'varchar', nullable: false })
  last_name!: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @CreateDateColumn()
  created_at!: Date;
}
