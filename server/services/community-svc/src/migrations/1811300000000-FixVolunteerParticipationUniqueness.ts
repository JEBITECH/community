import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Volunteer assignments have their own lifecycle/uniqueness rules. They must
 * not participate in the generic Participation registration indexes because
 * multiple volunteer roles may legitimately exist for the same event and/or
 * event component for the same member.
 *
 * Rejected/withdrawn volunteer assignments are audit history and must also be
 * replaceable by a new active assignment for the same role.
 */
export class FixVolunteerParticipationUniqueness1811300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The original Participation indexes were intentionally generic, but that
    // is incorrect for volunteer rows: two different VolunteerRole records
    // can share the same event_component_id (or both be event-level/null).
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_event_level"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_component_level"
    `);

    // Keep the generic uniqueness rule for normal event registrations only.
    // Volunteer uniqueness is enforced independently by
    // UQ_volunteer_assignment_active_membership_role.
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

    // Be defensive for databases that were upgraded from a partially-applied
    // lifecycle migration. There must never be a historical unique constraint
    // blocking a future sign-up after withdrawal/rejection.
    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      DROP CONSTRAINT IF EXISTS "UQ_volunteer_assignment_membership_role"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        "UQ_volunteer_assignment_active_membership_role"
      ON "volunteer_assignment" ("membership_id", "volunteer_role_id")
      WHERE "approval_status" IN ('pending', 'approved')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_event_level"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_participation_component_level"
    `);

    // Restore the pre-migration generic Participation behaviour.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_event_level"
      ON "participation" ("membership_id", "event_id", "type")
      WHERE "event_component_id" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_component_level"
      ON "participation" ("membership_id", "event_component_id", "type")
      WHERE "event_component_id" IS NOT NULL
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_volunteer_assignment_active_membership_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      ADD CONSTRAINT "UQ_volunteer_assignment_membership_role"
      UNIQUE ("membership_id", "volunteer_role_id")
    `);
  }
}
