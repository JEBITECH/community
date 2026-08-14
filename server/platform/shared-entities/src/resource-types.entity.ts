import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "resource_types" })
export class ResourceTypes {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  organization_id!: number;

  @Column({ nullable: false })
  pms_acc_id!: number;

  @Column({ nullable: false, unique: true })
  type!: string;

  @Column({ default: "active" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}