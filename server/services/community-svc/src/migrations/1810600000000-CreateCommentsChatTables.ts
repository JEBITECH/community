import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommentsChatTables1810600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_comment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "event_component_id" uuid,
        "membership_id" uuid NOT NULL,
        "parent_comment_id" uuid,
        "body" text NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "moderation_status" varchar NOT NULL DEFAULT 'visible',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_comment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_comment_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_event_comment_parent" FOREIGN KEY ("parent_comment_id") REFERENCES "event_comment"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_comment_event_id" ON "event_comment" ("event_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_chat_message" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "event_component_id" uuid,
        "membership_id" uuid NOT NULL,
        "body" text NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_chat_message" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_chat_message_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_chat_message_event_created" ON "event_chat_message" ("event_id", "createdAt")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_config" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "who_can_view" varchar NOT NULL DEFAULT 'internal_and_external',
        "who_can_post" varchar NOT NULL DEFAULT 'internal_and_external',
        "replies_allowed" boolean NOT NULL DEFAULT true,
        "moderation_required" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_config" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chat_config_event" UNIQUE ("event_id"),
        CONSTRAINT "FK_chat_config_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_config" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_chat_message" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_comment" CASCADE`);
  }
}
