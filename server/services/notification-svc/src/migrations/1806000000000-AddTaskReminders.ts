import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskReminders1806000000000 implements MigrationInterface {
  name = 'AddTaskReminders1806000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create notification_reminder_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_reminder_logs (
        id SERIAL PRIMARY KEY,
        task_id bigint NOT NULL,
        event_type varchar(255) NOT NULL,
        recipient_id varchar(255) NOT NULL,
        sent_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Create index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_reminder_logs_lookup
      ON notification_reminder_logs(task_id, event_type, recipient_id)
    `);

    // 2. Add settings column to notification_company_preferences table
    await queryRunner.query(`
      ALTER TABLE notification_company_preferences
      ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    // 3. Seed canonical templates
    await queryRunner.query(`
      INSERT INTO notification_templates (event_type, channel, language, subject, template, version)
      VALUES
        (
          'task.upcoming.24h',
          'email',
          'en',
          'Upcoming Task Reminder',
          '<p>Hello {{recipientName}},</p><p>Task "{{taskName}}" is scheduled to start in 24 hours.</p><p>Property: {{propertyName}}<br/>Start Time: {{scheduledTime}}</p>',
          1
        ),
        (
          'task.upcoming.1h',
          'email',
          'en',
          'Upcoming Task Reminder',
          '<p>Hello {{recipientName}},</p><p>Task "{{taskName}}" is scheduled to start in 1 hour.</p><p>Property: {{propertyName}}<br/>Start Time: {{scheduledTime}}</p>',
          1
        ),
        (
          'task.upcoming.15m',
          'email',
          'en',
          'Upcoming Task Reminder',
          '<p>Hello {{recipientName}},</p><p>Task "{{taskName}}" is scheduled to start in 15 minutes.</p><p>Property: {{propertyName}}<br/>Start Time: {{scheduledTime}}</p>',
          1
        ),
        (
          'task.overdue',
          'email',
          'en',
          'Task Overdue',
          '<p>Hello {{recipientName}},</p><p>Task "{{taskName}}" is overdue.</p><p>Scheduled Time: {{scheduledTime}}</p>',
          1
        )
      ON CONFLICT (event_type, channel, language, organization_id, version) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notification_templates
      WHERE event_type IN (
        'task.upcoming.24h',
        'task.upcoming.1h',
        'task.upcoming.15m',
        'task.overdue'
      )
      AND organization_id IS NULL
    `);

    await queryRunner.query(`ALTER TABLE notification_company_preferences DROP COLUMN IF EXISTS settings`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notification_reminder_logs_lookup`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_reminder_logs`);
  }
}
