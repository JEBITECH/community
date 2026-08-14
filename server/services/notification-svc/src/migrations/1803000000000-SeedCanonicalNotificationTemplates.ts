import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCanonicalNotificationTemplates1803000000000
  implements MigrationInterface
{
  name = 'SeedCanonicalNotificationTemplates1803000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO notification_templates (event_type, channel, language, subject, template, version)
      VALUES
        (
          'task.created',
          'email',
          'en',
          'New Task Created',
          '<p>Hello {{recipientName}},</p><p>A new task has been created for {{propertyName}}.</p><p>{{body}}</p>',
          1
        ),
        (
          'task.updated',
          'email',
          'en',
          'Task Updated',
          '<p>Hello {{recipientName}},</p><p>The task {{taskTitle}} has been updated.</p><p>{{body}}</p>',
          1
        ),
        (
          'task.assigned',
          'email',
          'en',
          'Task Assigned',
          '<p>Hello {{recipientName}},</p><p>You have been assigned a new task: {{taskTitle}}.</p><p>{{body}}</p>',
          1
        ),
        (
          'task.inspection.completed',
          'email',
          'en',
          'Task Inspection Completed',
          '<p>Hello {{recipientName}},</p><p>The inspection for {{taskTitle}} has been completed.</p><p>{{body}}</p>',
          1
        ),
        (
          'task.completed',
          'email',
          'en',
          'Task Completed',
          '<p>Hello {{recipientName}},</p><p>The task {{taskTitle}} has been completed.</p><p>{{body}}</p>',
          1
        )
      ON CONFLICT (event_type, channel, language, organization_id, version) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notification_templates
      WHERE event_type IN (
        'task.created',
        'task.updated',
        'task.assigned',
        'task.inspection.completed',
        'task.completed'
      )
      AND organization_id IS NULL
    `);
  }
}
