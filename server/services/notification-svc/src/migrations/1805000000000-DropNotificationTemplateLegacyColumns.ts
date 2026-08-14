import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNotificationTemplateLegacyColumns1805000000000 implements MigrationInterface {
  name = 'DropNotificationTemplateLegacyColumns1805000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS slug`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS track_opens`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS track_clicks`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS sent`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS opens`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS clicks`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS open_rate`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS click_rate`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS click_rate decimal(5,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS open_rate decimal(5,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS clicks int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS opens int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS sent int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS track_clicks boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS track_opens boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS slug varchar(100)`);
  }
}
