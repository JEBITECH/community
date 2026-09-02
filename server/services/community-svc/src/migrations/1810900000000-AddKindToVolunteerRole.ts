import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKindToVolunteerRole1810900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "volunteer_role" ADD COLUMN IF NOT EXISTS "kind" varchar NOT NULL DEFAULT 'volunteer'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "volunteer_role" DROP COLUMN IF EXISTS "kind"`);
  }
}