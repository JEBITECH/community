import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Follow-up to CommunityAppSchemaMigration: two PMS-era modules used naming
 * variants ('VirtueInspect', 'Owner Module') not covered by that migration's
 * retirement list. Hides them from the ACL UI like the others.
 */
export class RetireRemainingPmsModules1810100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "module" SET "status" = false
      WHERE "name" IN ('VirtueInspect', 'Owner Module')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "module" SET "status" = true
      WHERE "name" IN ('VirtueInspect', 'Owner Module')
    `);
  }
}
