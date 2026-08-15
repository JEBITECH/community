import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDonationSponsorshipTables1810400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "donation" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participation_id" uuid NOT NULL,
        "amount" decimal NOT NULL,
        "currency" varchar NOT NULL DEFAULT 'INR',
        "purpose" varchar NOT NULL DEFAULT 'event',
        "payment_status" varchar NOT NULL DEFAULT 'pending',
        "payment_method" varchar,
        "receipt_number" varchar,
        "recorded_by_user_id" uuid,
        "recorded_at" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_donation" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_donation_participation" UNIQUE ("participation_id"),
        CONSTRAINT "FK_donation_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sponsorship_need" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "event_id" uuid NOT NULL,
        "event_component_id" uuid,
        "title" varchar NOT NULL,
        "description" text,
        "target_amount" decimal NOT NULL,
        "amount_raised" decimal NOT NULL DEFAULT 0,
        "status" varchar NOT NULL DEFAULT 'open',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsorship_need" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sponsorship_need_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sponsorship_need_event_id" ON "sponsorship_need" ("event_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sponsorship" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participation_id" uuid NOT NULL,
        "sponsorship_need_id" uuid NOT NULL,
        "amount_pledged" decimal NOT NULL,
        "payment_status" varchar NOT NULL DEFAULT 'pending',
        "payment_method" varchar,
        "receipt_number" varchar,
        "recorded_by_user_id" uuid,
        "recorded_at" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsorship" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sponsorship_participation" UNIQUE ("participation_id"),
        CONSTRAINT "FK_sponsorship_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sponsorship_need" FOREIGN KEY ("sponsorship_need_id") REFERENCES "sponsorship_need"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sponsorship_need_id" ON "sponsorship" ("sponsorship_need_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sponsorship" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sponsorship_need" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "donation" CASCADE`);
  }
}
