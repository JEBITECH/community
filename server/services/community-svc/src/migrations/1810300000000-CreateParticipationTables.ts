import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateParticipationTables1810300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "participation" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "event_component_id" uuid,
        "membership_id" uuid NOT NULL,
        "type" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'active',
        "qr_code_token" uuid NOT NULL DEFAULT gen_random_uuid(),
        "attended_at" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participation" PRIMARY KEY ("id"),
        CONSTRAINT "FK_participation_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_participation_event_component" FOREIGN KEY ("event_component_id") REFERENCES "event_component"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_participation_membership_event" ON "participation" ("membership_id", "event_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_participation_org_type_status" ON "participation" ("organization_id", "type", "status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_participation_qr_token" ON "participation" ("qr_code_token")`);

    // Two partial unique indexes, not one plain UNIQUE constraint: Postgres
    // treats NULL != NULL, so a single UNIQUE(membership_id, event_component_id, type)
    // would silently allow a member to "join" the same *event* (component_id
    // NULL) more than once. Splitting by NULL-ness of event_component_id closes
    // that gap for both the event-level and component-level cases.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_participation_event_level"
      ON "participation" ("membership_id", "event_id", "type")
      WHERE "event_component_id" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_participation_component_level"
      ON "participation" ("membership_id", "event_component_id", "type")
      WHERE "event_component_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "booking" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participation_id" uuid NOT NULL,
        "seats_requested" integer NOT NULL DEFAULT 1,
        "booking_date" date,
        "slot_start" time,
        "slot_end" time,
        "cancelled_at" timestamptz,
        "cancel_reason" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_booking" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_booking_participation" UNIQUE ("participation_id"),
        CONSTRAINT "FK_booking_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "booking" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "participation" CASCADE`);
  }
}
