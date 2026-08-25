import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/** Flat (non-threaded) live-chat stream for an event, distinct from
 * EventComment's threaded discussion — a different UX and moderation model
 * (ephemeral chatter vs. durable Q&A). */
@Entity('event_chat_message')
@Index(['event_id', 'createdAt'])
export class EventChatMessage {
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

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
