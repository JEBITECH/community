import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes the quick Join vs detailed Participate path explicit. Both continue
 * to use participation.type='join' for backwards compatibility, but
 * registration_method records which UI path was used. Existing rows are
 * inferred from the presence of beneficiary detail.
 */
export class FixParticipationRegistrationMethod1811400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "participation"
      ADD COLUMN IF NOT EXISTS "registration_method" varchar NOT NULL DEFAULT 'join'
    `);

    await queryRunner.query(`
      UPDATE "participation" p
      SET "registration_method" = 'participate'
      WHERE p."type" = 'join'
        AND EXISTS (
          SELECT 1
          FROM "participation_beneficiary" b
          WHERE b."participation_id" = p."id"
        )
    `);

    await queryRunner.query(`
      UPDATE "participation"
      SET "registration_method" = 'book'
      WHERE "type" = 'book'
    `);

    await queryRunner.query(`
      ALTER TABLE "participation"
      ADD CONSTRAINT "CHK_participation_registration_method"
      CHECK ("registration_method" IN ('join', 'participate', 'book'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "participation"
      DROP CONSTRAINT IF EXISTS "CHK_participation_registration_method"
    `);
    await queryRunner.query(`
      ALTER TABLE "participation"
      DROP COLUMN IF EXISTS "registration_method"
    `);
  }
}
