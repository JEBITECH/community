import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A cancelled registration is historical/audit data and must not prevent the
 * same member from registering again for the same event/activity.
 *
 * The service-level duplicate check intentionally considers only active rows.
 * The database uniqueness constraint must enforce the same lifecycle rule;
 * otherwise PostgreSQL rejects a new registration because the cancelled row
 * still occupies the historical unique key.
 */
export class AllowReRegistrationAfterCancellation1811500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_event_level"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_component_level"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_event_level"
      ON "participation" ("membership_id", "event_id", "type")
      WHERE "event_component_id" IS NULL
        AND "type" <> 'volunteer'
        AND "status" <> 'cancelled'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_component_level"
      ON "participation" ("membership_id", "event_component_id", "type")
      WHERE "event_component_id" IS NOT NULL
        AND "type" <> 'volunteer'
        AND "status" <> 'cancelled'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_event_level"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_component_level"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_event_level"
      ON "participation" ("membership_id", "event_id", "type")
      WHERE "event_component_id" IS NULL
        AND "type" <> 'volunteer'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_component_level"
      ON "participation" ("membership_id", "event_component_id", "type")
      WHERE "event_component_id" IS NOT NULL
        AND "type" <> 'volunteer'
    `);
  }
}
