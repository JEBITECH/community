import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVolunteerTables1810500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "volunteer_role" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "event_component_id" uuid,
        "title" varchar NOT NULL,
        "description" text,
        "slot_start" time,
        "slot_end" time,
        "headcount_needed" integer NOT NULL,
        "headcount_filled" integer NOT NULL DEFAULT 0,
        "status" varchar NOT NULL DEFAULT 'open',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_volunteer_role" PRIMARY KEY ("id"),
        CONSTRAINT "FK_volunteer_role_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_volunteer_role_event_id" ON "volunteer_role" ("event_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "volunteer_assignment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participation_id" uuid NOT NULL,
        "volunteer_role_id" uuid NOT NULL,
        "membership_id" uuid NOT NULL,
        "approval_status" varchar NOT NULL DEFAULT 'pending',
        "approved_by_user_id" uuid,
        "approved_at" timestamptz,
        "attendance_marked" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_volunteer_assignment" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_volunteer_assignment_participation" UNIQUE ("participation_id"),
        CONSTRAINT "UQ_volunteer_assignment_membership_role" UNIQUE ("membership_id", "volunteer_role_id"),
        CONSTRAINT "FK_volunteer_assignment_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_volunteer_assignment_role" FOREIGN KEY ("volunteer_role_id") REFERENCES "volunteer_role"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_volunteer_assignment_role_id" ON "volunteer_assignment" ("volunteer_role_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "volunteer_assignment" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "volunteer_role" CASCADE`);
  }
}
