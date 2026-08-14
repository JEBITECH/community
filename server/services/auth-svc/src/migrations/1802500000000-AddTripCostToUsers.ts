import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTripCostToUsers1802500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "include_trip_cost" BOOLEAN DEFAULT FALSE;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cost_per_km" DOUBLE PRECISION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "include_trip_cost";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "cost_per_km";
    `);
  }
}
