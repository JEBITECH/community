import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

@Entity('announcement')
@Index(['organization_id', 'is_deleted', 'is_pinned', 'published_at'])
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid' })
  membership_id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority!: AnnouncementPriority;

  @Column({ type: 'boolean', default: false })
  is_pinned!: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  published_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
