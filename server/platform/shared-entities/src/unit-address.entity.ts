import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("unit_addresses")
export class UnitAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  address_line_1?: string;

  @Column({ nullable: true })
  address_line_2?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  county?: string;

  @Column({ nullable: true })
  full?: string;

  @Column({ nullable: true })
  lat?: string;

  @Column({ nullable: true })
  lng?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  street?: string;

  @Column({ nullable: true })
  zipcode?: string;
}
