import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the ERP/PMS task-reminder notification feature this service
 * inherited from the vacation-rental system it was extracted from — the
 * community app has no "task" concept, and this was never wired to
 * anything reachable from it (notification_reminder_logs was already
 * write-only dead code; see notification-preferences.service.ts).
 *
 * Replaces the older AddTaskReminders1806000000000 migration rather than
 * reverting it in place, since a real migration (SeedBookingNotification
 * Templates1807000000000) ran after it — TypeORM can only revert the most
 * recent migration, not one out of order.
 */
export class RemoveTaskReminderArtifacts1808000000000 implements MigrationInterface {
  name = 'RemoveTaskReminderArtifacts1808000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM notification_templates WHERE event_type LIKE 'task.%'`);

    await queryRunner.query(`ALTER TABLE notification_company_preferences DROP COLUMN IF EXISTS settings`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_notification_reminder_logs_lookup`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_reminder_logs`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_task`);
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS task_id`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Deliberately one-directional: this migration retires a feature (and
    // its seeded template data) rather than toggling a reversible change.
  }
}
