import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixVolunteerAssignmentLifecycle1811200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve audit history for old rows where cancellation left the
    // assignment marked "approved" while its Participation was cancelled.
    await queryRunner.query(`
      UPDATE "volunteer_assignment" AS a
      SET "approval_status" = 'withdrawn'
      FROM "participation" AS p
      WHERE p."id" = a."participation_id"
        AND p."status" = 'cancelled'
        AND a."approval_status" = 'approved'
    `);

    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      DROP CONSTRAINT IF EXISTS "UQ_volunteer_assignment_membership_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      DROP CONSTRAINT IF EXISTS "CK_volunteer_assignment_approval_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      ADD CONSTRAINT "CK_volunteer_assignment_approval_status"
      CHECK ("approval_status" IN ('pending', 'approved', 'rejected', 'withdrawn'))
    `);

    // Keep rejected/withdrawn assignments as audit records, but allow the
    // same member to sign up for the same role again after leaving it.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        "UQ_volunteer_assignment_active_membership_role"
      ON "volunteer_assignment" ("membership_id", "volunteer_role_id")
      WHERE "approval_status" IN ('pending', 'approved')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS
        "UQ_volunteer_assignment_active_membership_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      DROP CONSTRAINT IF EXISTS "CK_volunteer_assignment_approval_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "volunteer_assignment"
      ADD CONSTRAINT "UQ_volunteer_assignment_membership_role"
      UNIQUE ("membership_id", "volunteer_role_id")
    `);
  }
}
