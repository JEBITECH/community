import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type CommentModerationStatus = 'visible' | 'hidden' | 'reported';

/** One-level-threaded discussion on an event or a specific component within
 * it. parent_comment_id is only ever set on a top-level (parent_comment_id
 * IS NULL) comment's replies — replies-to-replies aren't modeled, matching
 * the "1-level threaded" scope in the spec. */
@Entity('event_comment')
@Index(['event_id'])
export class EventComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid' })
  event_id!: string;

  @Column({ type: 'uuid', nullable: true })
  event_component_id?: string | null;

  @Column({ type: 'uuid' })
  membership_id!: string;

  @Column({ type: 'uuid', nullable: true })
  parent_comment_id?: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @Column({ type: 'boolean', default: false })
  is_pinned!: boolean;

  @Column({ type: 'varchar', default: 'visible' })
  moderation_status!: CommentModerationStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
