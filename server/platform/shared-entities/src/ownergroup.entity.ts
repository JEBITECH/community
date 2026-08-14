// import { OwnerFormula } from 'src/ownerformula/entities/ownerformula.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OwnerGroupUnit } from './ownergroupunit.entity';
import { OwnerFormula } from './owner-formula.entity';
import { Organization } from './organization.entity';
@Entity()
export class OwnerGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => OwnerGroupUnit, (ownerGroupUnit) => ownerGroupUnit.ownergroup)
  ownergroupunit!: OwnerGroupUnit[];

  @Column()
  organization_id!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column()
  group_name!: string;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ default: null })
  selectedgrouptype?: string;

  @Column({ default: null })
  ownerformula_id?: number;

  @ManyToOne(() => OwnerFormula)
  @JoinColumn({ name: 'ownerformula_id', referencedColumnName: 'id' })
  ownerformula?: OwnerFormula;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
