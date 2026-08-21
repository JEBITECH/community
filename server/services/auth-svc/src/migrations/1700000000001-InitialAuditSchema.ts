import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Same problem as InitialSchema1700000000000, one layer further down: the
 * audit tables (audit_config, audit_logs, api_logs, audit_transaction) are
 * registered as entities in every service's DataSource, and
 * AuditLogService.loadAuditConfig() queries "audit_config" directly at boot
 * — but no migration anywhere ever creates them. On an already-working
 * machine they exist (same synchronize:true history as InitialSchema), so
 * this was never caught until a genuinely fresh clone crashed at startup
 * with "relation audit_config does not exist", one step past where
 * InitialSchema already got migration:run to succeed.
 *
 * Split into its own migration (not folded into InitialSchema) because
 * InitialSchema had already run — and been recorded — on working machines
 * by the time this was found; a second additive, IF NOT EXISTS-guarded
 * migration is what actually reaches those machines when they next run
 * `migration:run`, where editing InitialSchema's file content would not.
 */
export class InitialAuditSchema1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
          CREATE TYPE "transaction_status_enum" AS ENUM ('SUCCESS', 'FAILURE', 'PENDING');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_config" (
        "id" SERIAL PRIMARY KEY,
        "organization_id" integer NOT NULL,
        "entity_name" varchar NOT NULL,
        "log_insert" boolean NOT NULL DEFAULT false,
        "log_update" boolean NOT NULL DEFAULT false,
        "log_delete" boolean NOT NULL DEFAULT false,
        "enabled" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" BIGSERIAL PRIMARY KEY,
        "request_id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "entity_id" varchar NOT NULL,
        "entity_name" varchar NOT NULL,
        "operation" varchar(10) NOT NULL,
        "old_values" jsonb,
        "new_values" jsonb,
        "transaction_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" integer,
        "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT "CHK_audit_logs_operation" CHECK ("operation" IN ('INSERT', 'UPDATE', 'REMOVE'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_logs" (
        "id" BIGSERIAL PRIMARY KEY,
        "request_id" uuid NOT NULL,
        "transaction_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "microservice_name" varchar,
        "method" varchar,
        "path" varchar NOT NULL,
        "status_code" int,
        "response_timeMs" int,
        "error_message" varchar,
        "stack_trace" text,
        "organization_id" integer,
        "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        "created_by" uuid,
        CONSTRAINT "UQ_api_logs_request_id" UNIQUE ("request_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_transaction" (
        "id" BIGSERIAL PRIMARY KEY,
        "transaction_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" int,
        "user_id" uuid,
        "session_id" varchar,
        "transaction_type" varchar,
        "started_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        "ended_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        "transaction_status" "transaction_status_enum" NOT NULL,
        "enable_logging" boolean NOT NULL,
        CONSTRAINT "UQ_audit_transaction_transaction_id" UNIQUE ("transaction_id")
      )
    `);
  }

  public async down(): Promise<void> {
    // Intentionally one-directional, same as InitialSchema — see that
    // file's down() for why.
  }
}
