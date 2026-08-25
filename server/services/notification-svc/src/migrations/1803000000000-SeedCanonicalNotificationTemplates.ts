import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCanonicalNotificationTemplates1803000000000
  implements MigrationInterface
{
  name = 'SeedCanonicalNotificationTemplates1803000000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // The task.* templates this migration originally seeded belonged to the
    // ERP/PMS task-reminder feature, retired by
    // RemoveTaskReminderArtifacts1808000000000 — nothing left to seed here.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // See up() — no-op.
  }
}
