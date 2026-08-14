import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnhancedNotificationTemplateColumns1804000000000 implements MigrationInterface {
  name = 'AddEnhancedNotificationTemplateColumns1804000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS name varchar(100)`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS description text`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS category varchar(30) DEFAULT 'transactional'`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS type varchar(50)`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS html_content text`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS text_content text`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS json_content text`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS preheader varchar`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'draft'`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS created_by varchar(255)`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS updated_by varchar(255)`);
    await queryRunner.query(`ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS deleted_at timestamptz`);

    await queryRunner.query(`
      UPDATE notification_templates
      SET
        name = COALESCE(name, subject, event_type),
        description = COALESCE(description, NULL),
        category = COALESCE(category, 'transactional'),
        type = COALESCE(type, event_type),
        html_content = COALESCE(html_content, template),
        variables = CASE
          WHEN variables IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(variables) = 'object' THEN (
            SELECT COALESCE(jsonb_agg(key), '[]'::jsonb)
            FROM jsonb_each(variables)
          )
          ELSE variables
        END,
        text_content = COALESCE(text_content, NULL),
        json_content = COALESCE(json_content, NULL),
        preheader = COALESCE(preheader, NULL),
        status = COALESCE(status, 'draft')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS deleted_at`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS updated_by`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS created_by`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS is_default`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS status`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS preheader`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS json_content`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS variables`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS text_content`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS html_content`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS type`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS category`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS description`);
    await queryRunner.query(`ALTER TABLE notification_templates DROP COLUMN IF EXISTS name`);
  }
}
