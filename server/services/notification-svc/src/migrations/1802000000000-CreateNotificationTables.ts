import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTables1802000000000 implements MigrationInterface {
  name = 'CreateNotificationTables1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id serial PRIMARY KEY,
        name varchar(100),
        description text,
        event_type varchar NOT NULL,
        channel varchar NOT NULL,
        language varchar NOT NULL DEFAULT 'en',
        organization_id int4,
        category varchar(30) DEFAULT 'transactional',
        type varchar(50),
        html_content text,
        text_content text,
        json_content text,
        variables jsonb NOT NULL DEFAULT '[]'::jsonb,
        preheader varchar,
        status varchar(20) DEFAULT 'draft',
        is_default boolean NOT NULL DEFAULT false,
        template text NOT NULL,
        version int NOT NULL DEFAULT 1,
        is_active boolean NOT NULL DEFAULT true,
        subject varchar,
        fallback_template_id int,
        created_by varchar(255),
        updated_by varchar(255),
        deleted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notification_templates_organization
          FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
        CONSTRAINT fk_notification_templates_fallback
          FOREIGN KEY (fallback_template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
        CONSTRAINT uq_notification_templates_version
          UNIQUE (event_type, channel, language, organization_id, version)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_templates_lookup
      ON notification_templates (event_type, channel, language, is_active)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL,
        event_type varchar NOT NULL,
        entity_type varchar,
        entity_id varchar,
        tenant_id varchar,
        recipient_id uuid,
        channel varchar NOT NULL,
        status varchar NOT NULL DEFAULT 'PENDING',
        payload jsonb,
        organization_id int4,
        task_id int4,
        reservation_id int4,
        template_id int4,
        source_service varchar,
        idempotency_key varchar UNIQUE,
        priority int,
        subject varchar,
        content text,
        read_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notifications_organization
          FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
        CONSTRAINT fk_notifications_template
          FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_event_recipient
      ON notifications (event_type, recipient_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_status_channel
      ON notifications (status, channel)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_organization_event
      ON notifications (organization_id, event_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_task
      ON notifications (task_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_reservation
      ON notifications (reservation_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_user_preferences (
        id serial PRIMARY KEY,
        user_id uuid NOT NULL,
        organization_id int4,
        channels jsonb NOT NULL DEFAULT '{}',
        quiet_hours_start varchar,
        quiet_hours_end varchar,
        timezone varchar,
        do_not_disturb boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notification_user_preferences_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_notification_user_preferences_organization
          FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
        UNIQUE (user_id, organization_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_company_preferences (
        id serial PRIMARY KEY,
        organization_id int4 NOT NULL UNIQUE,
        channels jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notification_company_preferences_organization
          FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_role_preferences (
        id serial PRIMARY KEY,
        role varchar NOT NULL,
        role_id int4,
        organization_id int4,
        event_preferences jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notification_role_preferences_organization
          FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
        UNIQUE (role, organization_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id serial PRIMARY KEY,
        user_id uuid NOT NULL,
        organization_id int4,
        token text NOT NULL,
        platform varchar NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        last_seen_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_device_tokens_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_device_tokens_organization
          FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
        UNIQUE (user_id, token)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_device_tokens_organization_platform
      ON device_tokens (organization_id, platform)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_delivery_logs (
        id serial PRIMARY KEY,
        notification_id uuid NOT NULL,
        provider varchar NOT NULL,
        status varchar NOT NULL,
        attempt_number int NOT NULL DEFAULT 1,
        provider_message_id varchar,
        failure_reason text,
        response jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notification_delivery_logs_notification
          FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id
      ON notification_delivery_logs (notification_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_provider_status
      ON notification_delivery_logs (provider, status)
    `);

    await queryRunner.query(`
      INSERT INTO notification_templates (event_type, channel, language, subject, template, version)
      VALUES
        (
          'virtual-inspect.task.created',
          'email',
          'en',
          'New Inspection Task Created',
          '<p>Hello {{assigneeName}},</p><p>A new inspection task has been created for {{propertyName}}.</p><p>{{body}}</p>',
          1
        ),
        (
          'reservation.created',
          'email',
          'en',
          'Booking Confirmed',
          '<p>Hello {{guestName}},</p><p>Your booking for {{propertyName}} has been confirmed.</p>',
          1
        )
      ON CONFLICT (event_type, channel, language, organization_id, version) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS notification_delivery_logs');
    await queryRunner.query('DROP TABLE IF EXISTS device_tokens');
    await queryRunner.query('DROP TABLE IF EXISTS notification_role_preferences');
    await queryRunner.query('DROP TABLE IF EXISTS notification_company_preferences');
    await queryRunner.query('DROP TABLE IF EXISTS notification_user_preferences');
    await queryRunner.query('DROP TABLE IF EXISTS notifications');
    await queryRunner.query('DROP TABLE IF EXISTS notification_templates');
  }
}
