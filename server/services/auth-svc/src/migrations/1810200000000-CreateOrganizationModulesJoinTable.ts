import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Junction table backing Organization.modules (@ManyToMany with Module).
 * Tracks which modules are enabled for a given organization.
 */
export class CreateOrganizationModulesJoinTable1810200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_modules" (
        "organization_id" integer NOT NULL,
        "module_id" integer NOT NULL,
        CONSTRAINT "PK_organization_modules" PRIMARY KEY ("organization_id", "module_id"),
        CONSTRAINT "FK_organization_modules_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organization" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_organization_modules_module" FOREIGN KEY ("module_id")
          REFERENCES "module" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_organization_modules_organization_id"
        ON "organization_modules" ("organization_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_organization_modules_module_id"
        ON "organization_modules" ("module_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_modules"`);
  }
}