import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscussionsAndAnnouncements1811100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_discussion_topic" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "membership_id" uuid NOT NULL,
        "heading" varchar(300) NOT NULL,
        "body" text,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "is_closed" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_discussion_topic" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_discussion_topic_event"
          FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_discussion_topic_event_state"
      ON "event_discussion_topic"
        ("event_id", "is_deleted", "is_pinned", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_discussion_topic_org"
      ON "event_discussion_topic" ("organization_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comment"
      ADD COLUMN IF NOT EXISTS "discussion_topic_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comment"
      DROP CONSTRAINT IF EXISTS "FK_event_comment_discussion_topic"
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comment"
      ADD CONSTRAINT "FK_event_comment_discussion_topic"
      FOREIGN KEY ("discussion_topic_id")
      REFERENCES "event_discussion_topic"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_comment_discussion_topic_id"
      ON "event_comment" ("discussion_topic_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "announcement" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "membership_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "body" text NOT NULL,
        "priority" varchar(20) NOT NULL DEFAULT 'normal',
        "is_pinned" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "published_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcement" PRIMARY KEY ("id"),
        CONSTRAINT "CK_announcement_priority"
          CHECK ("priority" IN ('normal', 'important', 'urgent'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_announcement_org_state"
      ON "announcement"
        ("organization_id", "is_deleted", "is_pinned", "published_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "announcement" CASCADE`);
    await queryRunner.query(`
      ALTER TABLE "event_comment"
      DROP CONSTRAINT IF EXISTS "FK_event_comment_discussion_topic"
    `);
    await queryRunner.query(`
      ALTER TABLE "event_comment"
      DROP COLUMN IF EXISTS "discussion_topic_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_discussion_topic" CASCADE`);
  }
}
