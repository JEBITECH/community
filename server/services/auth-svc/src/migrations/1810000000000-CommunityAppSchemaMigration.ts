import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Rebuilds the User/Organization schema for the Community App:
 * - Introduces `membership` (per-org user↔role↔status) and `invitation_code`.
 * - Drops PMS/franchise-only columns from `users` and `organization`.
 * - Drops the now-unused `pms_master`/`pms_config` tables.
 * - Retires the PMS-era ACL modules and seeds the community module/action set.
 *
 * Existing `users.organization_id` rows (if any, e.g. from dev seed data) are
 * migrated into `membership` before the column is dropped, so no membership
 * data is silently lost.
 */
export class CommunityAppSchemaMigration1810000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. users: add OTP/identity columns, relax email ──────────────────────
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_code_hash" varchar`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_expires_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_attempts" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_last_requested_at" timestamptz`);

    // Rename the old platform-admin role value to match the new Role enum.
    await queryRunner.query(`UPDATE "users" SET "role" = 'master_admin' WHERE "role" = 'platformOwner'`);

    // ─── 2. organization: add community fields ─────────────────────────────────
    await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "organization_type" varchar NOT NULL DEFAULT 'society'`);
    await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "subdomain" varchar`);
    await queryRunner.query(`UPDATE "organization" SET "subdomain" = 'org-' || "id"::text WHERE "subdomain" IS NULL`);
    await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "subdomain" SET NOT NULL`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_organization_subdomain') THEN
          ALTER TABLE "organization" ADD CONSTRAINT "UQ_organization_subdomain" UNIQUE ("subdomain");
        END IF;
      END $$;
    `);
    await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "plan" varchar NOT NULL DEFAULT 'free'`);
    await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "membership_model" varchar NOT NULL DEFAULT 'approval_required'`);

    // ─── 3. membership + invitation_code tables ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "membership" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "organization_id" integer NOT NULL,
        "role" varchar NOT NULL,
        "roleId" integer,
        "member_type" varchar NOT NULL DEFAULT 'internal',
        "unit_identifier" varchar,
        "status" varchar NOT NULL DEFAULT 'pending',
        "directory_visible" boolean NOT NULL DEFAULT true,
        "joined_at" timestamptz,
        "approved_by_user_id" uuid,
        "is_default" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_membership" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_membership_user_org" UNIQUE ("user_id", "organization_id"),
        CONSTRAINT "FK_membership_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_membership_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_membership_user_id" ON "membership" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_membership_organization_id" ON "membership" ("organization_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invitation_code" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" integer NOT NULL,
        "code" varchar NOT NULL,
        "max_uses" integer NOT NULL DEFAULT 1,
        "uses_count" integer NOT NULL DEFAULT 0,
        "expires_at" timestamptz,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitation_code" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invitation_code_code" UNIQUE ("code"),
        CONSTRAINT "FK_invitation_code_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE
      )
    `);

    // ─── 4. Migrate any existing user↔org rows into membership before dropping ──
    await queryRunner.query(`
      INSERT INTO "membership" ("user_id", "organization_id", "role", "member_type", "status", "is_default", "joined_at")
      SELECT "id", "organization_id",
        CASE "role"
          WHEN 'super_admin' THEN 'super_admin'
          WHEN 'master_admin' THEN 'super_admin'
          ELSE 'internal_member'
        END,
        'internal', 'active', true, now()
      FROM "users"
      WHERE "organization_id" IS NOT NULL
      ON CONFLICT ("user_id", "organization_id") DO NOTHING
    `);

    // ─── 5. Drop PMS-only columns from users and organization ──────────────────
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "organization_id"`);
    for (const col of [
      'pms_id', 'owner_type', 'property_ids', 'franchisee_id',
      'is_task_view', 'task_types', 'is_reservation_view', 'reservation_details',
      'is_owner_view', 'owner_details', 'is_unit_view', 'unit_types',
      'is_document_view', 'is_graph_view', 'cost_per_hour', 'cost_per_month',
      'include_trip_cost', 'cost_per_km', 'location_coordinate', 'location_coordinate_end',
      'company_identification_number', 'tax_number', 'freefield1', 'freefield2',
    ]) {
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "${col}"`);
    }

    for (const col of ['organization_property_locations', 'is_franchisor', 'parent_org_id']) {
      await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN IF EXISTS "${col}"`);
    }

    // ─── 6. Drop now-orphaned PMS tables ─────────────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS "pms_config" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pms_master" CASCADE`);

    // ─── 7. Retire PMS-era ACL modules (kept as history, hidden from the UI) ────
    await queryRunner.query(`
      UPDATE "module" SET "status" = false
      WHERE "name" IN ('Virtual Inspect', 'Virtuel Inspect', 'Accounting', 'CRM', 'Booking Engine', 'OKR', 'Digital Hand Book', 'PMS Systems')
    `);

    // ─── 8. Seed community modules/actions ───────────────────────────────────────
    const communityModules: { name: string; isInternal: boolean; actions: string[] }[] = [
      { name: 'Events', isInternal: false, actions: ['View', 'Create', 'Edit', 'Publish', 'Delete'] },
      { name: 'Bookings', isInternal: false, actions: ['View', 'CreateOnBehalf', 'Cancel'] },
      { name: 'Donations', isInternal: false, actions: ['View', 'Record'] },
      { name: 'Sponsorship', isInternal: false, actions: ['View', 'Manage', 'Record'] },
      { name: 'Volunteer', isInternal: false, actions: ['View', 'Manage', 'Approve'] },
      { name: 'Comments', isInternal: false, actions: ['View', 'Moderate'] },
      { name: 'Chat', isInternal: false, actions: ['View', 'Configure'] },
      { name: 'Attendance', isInternal: false, actions: ['Scan'] },
      { name: 'Members', isInternal: false, actions: ['View', 'Invite', 'Approve', 'Edit'] },
      { name: 'Reports', isInternal: false, actions: ['View', 'Export'] },
      { name: 'Dashboard', isInternal: false, actions: ['View'] },
      { name: 'Organization Management', isInternal: true, actions: ['View', 'Edit', 'ManageRoles', 'ManageModules'] },
      { name: 'Platform Dashboard', isInternal: true, actions: ['View'] },
      { name: 'Organizations', isInternal: true, actions: ['View', 'Create', 'Edit', 'Suspend'] },
    ];

    for (const mod of communityModules) {
      const existing = await queryRunner.query(`SELECT id FROM "module" WHERE "name" = $1`, [mod.name]);
      let moduleId: number;
      if (existing.length > 0) {
        moduleId = existing[0].id;
        await queryRunner.query(`UPDATE "module" SET "status" = true, "is_internal" = $2 WHERE "id" = $1`, [moduleId, mod.isInternal]);
      } else {
        const inserted = await queryRunner.query(
          `INSERT INTO "module" ("name", "status", "is_internal", "createdAt", "updatedAt")
           VALUES ($1, true, $2, now(), now()) RETURNING id`,
          [mod.name, mod.isInternal],
        );
        moduleId = inserted[0].id;
      }

      for (const actionName of mod.actions) {
        const existingAction = await queryRunner.query(
          `SELECT id FROM "action" WHERE "module_id" = $1 AND "name" = $2`,
          [moduleId, actionName],
        );
        if (existingAction.length === 0) {
          await queryRunner.query(
            `INSERT INTO "action" ("module_id", "name", "status", "createdAt", "updatedAt")
             VALUES ($1, $2, true, now(), now())`,
            [moduleId, actionName],
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invitation_code" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "membership" CASCADE`);
    await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT IF EXISTS "UQ_organization_subdomain"`);
    for (const col of ['organization_type', 'subdomain', 'plan', 'membership_model']) {
      await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN IF EXISTS "${col}"`);
    }
    for (const col of ['phone_verified', 'otp_code_hash', 'otp_expires_at', 'otp_attempts', 'otp_last_requested_at']) {
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "${col}"`);
    }
    // Note: PMS columns/tables and pre-migration module data are not restored by down();
    // this migration is intentionally one-directional for the community-app rebuild.
  }
}
