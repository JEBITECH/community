import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedModulesActionsSubactions1758608464749 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const data = [
      {
        name: "Virtual Inspect",
        actions: [
          { name: "Settlement", subactions: ["create settlement", "manage ledger", "settlement formula", "statement"] },
          { name: "Property Management", subactions: ["properties", "units", "unit types", "owner groups"] },
          { name: "Task Management", subactions: ["housekeeping", "supervised tasks"] },
          { name: "User Management", subactions: ["users", "ACL management"] },
          { name: "Digital Handbook", subactions: [] },
          { name: "Owner and Guest Portal", subactions: [] },
        ],
      },
      {
        name: "Accounting",
        actions: [
          {
            name: "Accounting Dashboard",
            subactions: []
          },
          {
            name: "Configuration",
            subactions: [
              "System Configuration",
              "Accounting Configuration"
            ]
          },
          {
            name: "Chart of Accounts",
            subactions: []
          },
          {
            name: "Journals",
            subactions: [
              "Income",
              "Expense",
              "Receipt",
              "Payment",
              "Adjustments"
            ]
          },
          {
            name: "Reports",
            subactions: [
              "Trial Balance",
              "Profit & Loss Account",
              "Balance Sheet",
              "Cash Flow Statement"
            ]
          },
        ],
      },
      { name: "CRM", actions: [] },
      { name: "Booking Engine", actions: [] },
      { name: "OKR", actions: [] },
      {
        name: "Digital Hand Book",
        actions: [
          { name: "View Request", subactions: [] },
          { name: "View Review", subactions: [] },
          { name: "View Report", subactions: [] }
        ]
      },

    ];

    for (const module of data) {
      // Insert or fetch module
      const existingModule = await queryRunner.query(
        `SELECT id FROM "module" WHERE "name" = $1`,
        [module.name]
      );

      let moduleId: number;
      if (existingModule.length > 0) {
        moduleId = existingModule[0].id;
      } else {
        const insertedModule = await queryRunner.query(
          `INSERT INTO "module" ("name", "status", "createdAt", "updatedAt")
           VALUES ($1, true, now(), now())
           RETURNING id`,
          [module.name]
        );
        moduleId = insertedModule[0].id;
      }

      // Insert actions
      for (const action of module.actions) {
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
        }

        // Insert subactions
        for (const sub of action.subactions) {
          const existingSub = await queryRunner.query(
            `SELECT id FROM "sub_action" WHERE "module_id" = $1 AND "action_id" = $2 AND "name" = $3`,
            [moduleId, actionId, sub]
          );

          if (existingSub.length === 0) {
            await queryRunner.query(
              `INSERT INTO "sub_action" ("module_id", "action_id", "name", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, now(), now())`,
              [moduleId, actionId, sub]
            );
          }
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const moduleNames = ["Virtuel Inspect", "Accounting", "CRM", "Booking Engine", "OKR"];

    // Delete subactions
    await queryRunner.query(
      `DELETE FROM "sub_action"
       WHERE "action_id" IN (
         SELECT a.id FROM "action" a
         WHERE a."module_id" IN (
           SELECT m.id FROM "module" m WHERE m."name" = ANY($1::text[])
         )
       )`,
      [moduleNames]
    );

    // Delete actions
    await queryRunner.query(
      `DELETE FROM "action"
       WHERE "module_id" IN (
         SELECT m.id FROM "module" m WHERE m."name" = ANY($1::text[])
       )`,
      [moduleNames]
    );

    // Delete modules
    await queryRunner.query(
      `DELETE FROM "module" WHERE "name" = ANY($1::text[])`,
      [moduleNames]
    );
  }
}
