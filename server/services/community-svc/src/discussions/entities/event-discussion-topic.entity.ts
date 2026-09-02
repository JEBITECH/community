import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('event_discussion_topic')
@Index(['event_id', 'is_deleted', 'is_pinned', 'createdAt'])
@Index(['organization_id'])
export class EventDiscussionTopic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid' })
  event_id!: string;

  @Column({ type: 'uuid' })
  membership_id!: string;

  @Column({ type: 'varchar', length: 300 })
  heading!: string;

  @Column({ type: 'text', nullable: true })
  body?: string | null;

  @Column({ type: 'boolean', default: false })
  is_pinned!: boolean;

  @Column({ type: 'boolean', default: false })
  is_closed!: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
