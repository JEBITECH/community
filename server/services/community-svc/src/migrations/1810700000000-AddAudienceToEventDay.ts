import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAudienceToEventDay1810700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_day" ADD COLUMN IF NOT EXISTS "audience" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_day" DROP COLUMN IF EXISTS "audience"
    `);
  }
}