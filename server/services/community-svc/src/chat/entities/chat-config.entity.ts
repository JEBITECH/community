import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ChatVisibility } from '../../common/helpers/chat-permission.helper';

/** One config row per event (not per-component — MVP scope keeps chat
 * configuration event-wide, matching how the prototype exposes a single
 * moderation toggle set per event). Absent a row, callers fall back to the
 * permissive defaults in ChatConfigService.DEFAULTS rather than creating one
 * eagerly on every event. */
@Entity('chat_config')
export class ChatConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  organization_id!: number;

  @Column({ type: 'uuid', unique: true })
  event_id!: string;

  @Column({ type: 'varchar', default: 'internal_and_external' })
  who_can_view!: ChatVisibility;

  @Column({ type: 'varchar', default: 'internal_and_external' })
  who_can_post!: ChatVisibility;

  @Column({ type: 'boolean', default: true })
  replies_allowed!: boolean;

  @Column({ type: 'boolean', default: false })
  moderation_required!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
