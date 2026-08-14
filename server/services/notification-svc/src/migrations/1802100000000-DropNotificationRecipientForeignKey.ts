import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNotificationRecipientForeignKey1802100000000
  implements MigrationInterface
{
  name = 'DropNotificationRecipientForeignKey1802100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_record record;
      BEGIN
        FOR constraint_record IN
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = current_schema()
            AND tc.table_name = 'notifications'
            AND kcu.column_name = 'recipient_id'
        LOOP
          EXECUTE format(
            'ALTER TABLE notifications DROP CONSTRAINT IF EXISTS %I',
            constraint_record.constraint_name
          );
        END LOOP;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT fk_notifications_recipient
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
    `);
  }
}
