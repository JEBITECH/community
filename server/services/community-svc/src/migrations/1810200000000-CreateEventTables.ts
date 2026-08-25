import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventTables1810200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "event_type" varchar NOT NULL,
        "is_multi_day" boolean NOT NULL DEFAULT false,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "venue" varchar,
        "cover_image_url" text,
        "capacity" integer,
        "audience" varchar NOT NULL DEFAULT 'internal',
        "registration_required" boolean NOT NULL DEFAULT true,
        "booking_enabled" boolean NOT NULL DEFAULT false,
        "donation_enabled" boolean NOT NULL DEFAULT false,
        "volunteer_enabled" boolean NOT NULL DEFAULT false,
        "sponsorship_enabled" boolean NOT NULL DEFAULT false,
        "status" varchar NOT NULL DEFAULT 'draft',
        "created_by_user_id" uuid NOT NULL,
        "published_at" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_organization_id" ON "event" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_organization_status" ON "event" ("organization_id", "status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_day" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "day_number" integer NOT NULL,
        "date" date NOT NULL,
        "title" varchar NOT NULL,
        "description" text,
        "sequence" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_day" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_day_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_day_event_day_number" ON "event_day" ("event_id", "day_number")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_component" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_day_id" uuid NOT NULL,
        "organization_id" integer NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "component_type" varchar NOT NULL DEFAULT 'activity',
        "start_time" time,
        "end_time" time,
        "requires_booking" boolean NOT NULL DEFAULT false,
        "location_resource" varchar,
        "capacity" integer,
        "audience" varchar,
        "registration_enabled" boolean NOT NULL DEFAULT true,
        "donation_enabled" boolean NOT NULL DEFAULT false,
        "sponsorship_enabled" boolean NOT NULL DEFAULT false,
        "volunteer_enabled" boolean NOT NULL DEFAULT false,
        "price_internal" decimal,
        "price_external" decimal,
        "status" varchar NOT NULL DEFAULT 'draft',
        "sequence" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_component" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_component_event_day" FOREIGN KEY ("event_day_id") REFERENCES "event_day"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_component_event_day_id" ON "event_component" ("event_day_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_event_component_organization_id" ON "event_component" ("organization_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_organizer" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "membership_id" uuid NOT NULL,
        "role_label" varchar NOT NULL DEFAULT 'co_organizer',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_organizer" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_organizer_event_membership" UNIQUE ("event_id", "membership_id"),
        CONSTRAINT "FK_event_organizer_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "event_organizer" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_component" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_day" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event" CASCADE`);
  }
}
