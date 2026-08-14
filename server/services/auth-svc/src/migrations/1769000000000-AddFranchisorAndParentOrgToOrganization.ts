import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFranchisorAndParentOrgToOrganization1769000000000 implements MigrationInterface {
  name = "AddFranchisorAndParentOrgToOrganization1769000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization
      ADD COLUMN IF NOT EXISTS is_franchisor BOOLEAN NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE organization
      ADD COLUMN IF NOT EXISTS parent_org_id INTEGER DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization
      DROP COLUMN IF EXISTS parent_org_id
    `);

    await queryRunner.query(`
      ALTER TABLE organization
      DROP COLUMN IF EXISTS is_franchisor
    `);
  }
}
