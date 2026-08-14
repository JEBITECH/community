import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedSeedModulesActionsSubactions1758620000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Complete module structure with correct names and actions
    const data = [
      {
        name: "VirtueInspect",
        actions: [
          { name: "All Task", subactions: [] },
          { name: "Checklist", subactions: [] },
          { name: "Template", subactions: [] },
        ],
      },
      {
        name: "Accounting",
        actions: [
          { name: "Accounting Dashboard", subactions: [] },
          {
            name: "Configuration",
            subactions: [
              "System Configuration",
              "Accounting Configuration",
            ],
          },
          { name: "Chart of Accounts", subactions: [] },
          {
            name: "Journals",
            subactions: [
              "Income",
              "Expense",
              "Receipt",
              "Payment",
              "Adjustments",
            ],
          },
          {
            name: "Reports",
            subactions: [
              "Trial Balance",
              "Profit & Loss Account",
              "Balance Sheet",
              "Cash Flow Statement",
            ],
          },
        ],
      },
      { 
        name: "Owner Module", 
        actions: [
          { name: "Owner Settlement Formula", subactions: [] },
          { name: "Group Owner Settlement", subactions: [] },
          { name: "Settlement Overview", subactions: [] },
        ]
      },
      { 
        name: "Booking Engine", 
        actions: [] 
      },
      { 
        name: "OKR", 
        actions: [] 
      },
      {
        name: "Digital Hand Book",
        actions: [
          { name: "View Requests", subactions: [] },
          { name: "View Reviews", subactions: [] },
          { name: "View Issues", subactions: [] },
        ],
      },
    ];

    // First, rename CRM to Owner Module if it exists
    await queryRunner.query(`
      UPDATE "module"
      SET name = 'Owner Module'
      WHERE name = 'CRM'
    `);

    // Also handle "Virtual Inspect" -> "VirtueInspect" rename
    await queryRunner.query(`
      UPDATE "module"
      SET name = 'VirtueInspect'
      WHERE name = 'Virtual Inspect'
    `);

    for (const module of data) {
      // Check if module exists
      const existingModule = await queryRunner.query(
        `SELECT id FROM "module" WHERE "name" = $1`,
        [module.name]
      );

      let moduleId: number;
      if (existingModule.length > 0) {
        moduleId = existingModule[0].id;
        
        // Clean up existing actions and subactions for this module
        // Delete role_module_access first (foreign key constraint)
        await queryRunner.query(
          `DELETE FROM role_module_access
           WHERE module_id = $1
             AND (action_id IS NOT NULL OR sub_action_id IS NOT NULL)`,
          [moduleId]
        );
        
        // Delete subactions
        await queryRunner.query(
          `DELETE FROM sub_action WHERE module_id = $1`,
          [moduleId]
        );
        
        // Delete actions
        await queryRunner.query(
          `DELETE FROM action WHERE module_id = $1`,
          [moduleId]
        );
      } else {
        // Insert new module
        const insertedModule = await queryRunner.query(
          `INSERT INTO "module" ("name", "status", "createdAt", "updatedAt")
           VALUES ($1, true, now(), now())
           RETURNING id`,
          [module.name]
        );
        moduleId = insertedModule[0].id;
      }

      // Insert actions and subactions
      for (const action of module.actions) {
        const insertedAction = await queryRunner.query(
          `INSERT INTO "action" ("module_id", "name", "status", "createdAt", "updatedAt")
           VALUES ($1, $2, true, now(), now())
           RETURNING id`,
          [moduleId, action.name]
        );
        
        const actionId = insertedAction[0].id;

        // Insert subactions
        for (const subAction of action.subactions) {
          await queryRunner.query(
            `INSERT INTO "sub_action" ("module_id", "action_id", "name", "status", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, true, now(), now())`,
            [moduleId, actionId, subAction]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Owner Module back to CRM
    await queryRunner.query(`
      UPDATE "module"
      SET name = 'CRM'
      WHERE name = 'Owner Module'
    `);

    // Revert VirtueInspect back to Virtual Inspect
    await queryRunner.query(`
      UPDATE "module"
      SET name = 'Virtual Inspect'
      WHERE name = 'VirtueInspect'
    `);
  }
}
