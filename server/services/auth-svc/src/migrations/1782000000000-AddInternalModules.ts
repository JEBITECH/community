import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInternalModules1782000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Add is_internal column to module table ────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "module"
      ADD COLUMN IF NOT EXISTS "is_internal" BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('Added is_internal column to module table');

    // ─── 2. Mark Audit Logs as internal (already exists in DB) ───────────────
    await queryRunner.query(`
      UPDATE "module" SET "is_internal" = true WHERE "name" = 'Audit Logs'
    `);
    console.log('Marked Audit Logs as internal');

    // ─── 3. Seed internal modules ─────────────────────────────────────────────
    const internalModules = [
      {
        name: "Organization Management",
        actions: [],
      },
      {
        name: "PMS Systems",
        actions: [
          { name: "PMS Sync Data", subactions: [] },
          {
            name: "Properties",
            subactions: [
              "Property",
              "Unit Types",
              "Unit Area",
              "Units",
              "Unit Groups",
              "Guest Communication Setup",
            ],
          },
          { name: "Reservations", subactions: [] },
        ],
      },
      {
        name: "User Management",
        actions: [
          { name: "All Users", subactions: [] },
          { name: "Team Management", subactions: [] },
        ],
      },
      {
        name: "ACL Management",
        actions: [],
      },
    ];

    for (const moduleData of internalModules) {
      // Check if module exists
      const existing = await queryRunner.query(
        `SELECT id FROM "module" WHERE "name" = $1`,
        [moduleData.name]
      );

      let moduleId: number;
      if (existing.length > 0) {
        moduleId = existing[0].id;
        // Ensure is_internal is set to true
        await queryRunner.query(
          `UPDATE "module" SET "is_internal" = true WHERE "id" = $1`,
          [moduleId]
        );
        console.log(`Updated existing module '${moduleData.name}' → is_internal = true`);
      } else {
        const inserted = await queryRunner.query(
          `INSERT INTO "module" ("name", "status", "is_internal", "createdAt", "updatedAt")
           VALUES ($1, true, true, now(), now())
           RETURNING id`,
          [moduleData.name]
        );
        moduleId = inserted[0].id;
        console.log(`Created internal module '${moduleData.name}' (id: ${moduleId})`);
      }

      // Insert actions and subactions
      for (const action of moduleData.actions) {
        const existingAction = await queryRunner.query(
          `SELECT id FROM "action" WHERE "module_id" = $1 AND "name" = $2`,
          [moduleId, action.name]
        );

        let actionId: number;
        if (existingAction.length > 0) {
          actionId = existingAction[0].id;
        } else {
          const insertedAction = await queryRunner.query(
            `INSERT INTO "action" ("module_id", "name", "status", "createdAt", "updatedAt")
             VALUES ($1, $2, true, now(), now())
             RETURNING id`,
            [moduleId, action.name]
          );
          actionId = insertedAction[0].id;
          console.log(`  Added action '${action.name}'`);
        }

        for (const subName of action.subactions) {
          const existingSub = await queryRunner.query(
            `SELECT id FROM "sub_action" WHERE "action_id" = $1 AND "name" = $2`,
            [actionId, subName]
          );
          if (existingSub.length === 0) {
            await queryRunner.query(
              `INSERT INTO "sub_action" ("module_id", "action_id", "name", "status", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, true, now(), now())`,
              [moduleId, actionId, subName]
            );
            console.log(`    Added subaction '${subName}'`);
          }
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Audit Logs back to non-internal
    await queryRunner.query(`
      UPDATE "module" SET "is_internal" = false WHERE "name" = 'Audit Logs'
    `);

    // Remove seeded internal modules (only the ones we created here)
    const moduleNames = ['Organization Management', 'PMS Systems', 'User Management', 'ACL Management'];
    for (const name of moduleNames) {
      const mod = await queryRunner.query(
        `SELECT id FROM "module" WHERE "name" = $1`,
        [name]
      );
      if (mod.length > 0) {
        const moduleId = mod[0].id;
        await queryRunner.query(
          `DELETE FROM role_module_access WHERE "module_id" = $1`,
          [moduleId]
        );
        await queryRunner.query(
          `DELETE FROM "sub_action" WHERE "module_id" = $1`,
          [moduleId]
        );
        await queryRunner.query(
          `DELETE FROM "action" WHERE "module_id" = $1`,
          [moduleId]
        );
        await queryRunner.query(
          `DELETE FROM "module" WHERE "id" = $1`,
          [moduleId]
        );
      }
    }

    // Drop is_internal column
    await queryRunner.query(`
      ALTER TABLE "module" DROP COLUMN IF EXISTS "is_internal"
    `);
  }
}
