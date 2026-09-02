import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * "Add Day" gets a single Join/Participate/Both dropdown, stored as
 * event_day.registration_mode. This is a hard constraint, not a default:
 * event-components.service.ts enforces it at both create() and update() time
 * — an activity under a "Join"-only day can never have participation_enabled
 * set, and vice versa for a "Participate"-only day. "Both" leaves activities
 * free to pick either/both individually, same as before this feature
 * existed. The client mirrors this by only rendering the checkbox(es) the
 * day's mode allows in the Add Activity dialog, so the restriction is
 * visible before it's ever hit as a validation error — but the server is
 * the actual source of truth, not the hidden checkbox.
 */
export class AddDayRegistrationMode1811000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_day" ADD COLUMN IF NOT EXISTS "registration_mode" varchar NOT NULL DEFAULT 'both'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_day" DROP COLUMN IF EXISTS "registration_mode"`);
  }
}