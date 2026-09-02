import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Supports the "Join" vs "Participate" split on event_component:
 *  - event.timezone: the IANA zone the event's times are authored/displayed in.
 *  - event_component.participation_enabled: a second, independent toggle next
 *    to the existing registration_enabled — an admin can now offer "Join"
 *    (quick RSVP), "Participate" (detailed registration with beneficiaries),
 *    both, or neither, from the same Add Schedule dialog.
 *  - participation.mode / party_size: whether a single registration covers
 *    one person or several, and how many people it covers — party_size feeds
 *    the existing capacity check so a "multiple" participation consumes the
 *    right number of seats instead of always counting as 1.
 *  - participation_beneficiary: one row per person covered by a
 *    participation (the member themself, a family member, or someone else),
 *    optionally linked back to that person's own membership so admin reports
 *    can resolve who they are.
 */
export class AddParticipationDetailAndTimezone1810800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "timezone" varchar NOT NULL DEFAULT 'Asia/Kolkata'
    `);

    await queryRunner.query(`
      ALTER TABLE "event_component" ADD COLUMN IF NOT EXISTS "participation_enabled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "participation" ADD COLUMN IF NOT EXISTS "mode" varchar NOT NULL DEFAULT 'single'
    `);
    await queryRunner.query(`
      ALTER TABLE "participation" ADD COLUMN IF NOT EXISTS "party_size" integer NOT NULL DEFAULT 1
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "participation_beneficiary" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participation_id" uuid NOT NULL,
        "relation_type" varchar NOT NULL,
        "full_name" varchar NOT NULL,
        "membership_id" uuid,
        "notes" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participation_beneficiary" PRIMARY KEY ("id"),
        CONSTRAINT "FK_participation_beneficiary_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_participation_beneficiary_participation" ON "participation_beneficiary" ("participation_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_participation_beneficiary_membership" ON "participation_beneficiary" ("membership_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "participation_beneficiary" CASCADE`);
    await queryRunner.query(`ALTER TABLE "participation" DROP COLUMN IF EXISTS "party_size"`);
    await queryRunner.query(`ALTER TABLE "participation" DROP COLUMN IF EXISTS "mode"`);
    await queryRunner.query(`ALTER TABLE "event_component" DROP COLUMN IF EXISTS "participation_enabled"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "timezone"`);
  }
}