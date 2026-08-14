import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  code_number!: number;

  @Column({ nullable: true })
  official_language?: string;

  @Column()
  continent_name!: string;
}
