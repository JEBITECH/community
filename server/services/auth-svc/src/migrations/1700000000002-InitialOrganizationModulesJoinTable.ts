import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Same category of gap as InitialSchema/InitialAuditSchema, found the same
 * way: "organization_modules" is TypeORM's implicit many-to-many join table
 * for Organization.modules (@JoinTable on organization.entity.ts) -- never
 * created by any migration, only ever materialized by the early
 * synchronize:true history already-working machines have behind them.
 * Surfaced as "relation organization_modules does not exist" the first
 * time org onboarding tried to attach modules on a genuinely fresh
 * database.
 */
export class InitialOrganizationModulesJoinTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_modules" (
        "organization_id" integer NOT NULL,
        "module_id" integer NOT NULL,
        CONSTRAINT "PK_organization_modules" PRIMARY KEY ("organization_id", "module_id")
      )
    `);
  }

  public async down(): Promise<void> {
    // Intentionally one-directional, same as InitialSchema — see that
    // file's down() for why.
  }
}
