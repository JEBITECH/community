import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Baseline schema for a genuinely fresh database.
 *
 * None of the migrations after this one ever CREATE their base tables — they
 * only ALTER/INSERT, because historically this schema was materialized by
 * `synchronize: true` before `db.ts` switched to `synchronize: false`. On a
 * brand-new clone there was nothing left to create it, so `migration:run`
 * failed as soon as the first migration touched a table that didn't exist
 * (see CreateDefaultAdminUser's "organization_type" NOT NULL error, and
 * AddEmailVerificationExpires' "users" undefined_table error).
 *
 * Every statement here is guarded with IF NOT EXISTS, so on a database that
 * already has these tables (i.e. every machine that was already working)
 * this migration is a complete no-op.
 *
 * Tables are created in their PRE-migration-history shape on purpose —
 * deliberately missing columns that later migrations (AddEmailVerification
 * Expires, AddFranchisorAndParentOrgToOrganization, AddInternalModules,
 * AddTripCostToUsers, CommunityAppSchemaMigration, ...) go on to add. That's
 * what lets the existing 9 migrations run completely unmodified on top of
 * this one and land at the exact same final schema every already-set-up
 * machine already has. Do not "complete" these tables with current-entity
 * columns — that would make the later ALTER/DROP statements redundant or
 * wrong (e.g. CommunityAppSchemaMigration expects to find and drop
 * "users"."organization_id").
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization" (
        "id" SERIAL PRIMARY KEY,
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_name" varchar NOT NULL,
        "organization_email" varchar DEFAULT '',
        "organization_location" varchar NOT NULL,
        "organization_timezone" varchar DEFAULT 'UTC',
        "organization_contact_info" varchar,
        "is_archived" boolean NOT NULL DEFAULT false,
        "organization_status" varchar DEFAULT 'pending',
        "organization_logo" text,
        "allowed_domains" json,
        "theme_config_id" integer,
        CONSTRAINT "UQ_organization_uuid" UNIQUE ("uuid")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "theme" (
        "id" SERIAL PRIMARY KEY,
        "primary_color" varchar DEFAULT '#000000',
        "secondary_color" varchar DEFAULT '#ffffff',
        "font_family" varchar DEFAULT 'Arial',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" integer,
        "createdBy" integer
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "module" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar,
        "status" boolean,
        "is_internal" boolean DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" integer,
        "createdBy" integer
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "action" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar,
        "status" boolean,
        "module_id" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" integer,
        "createdBy" integer
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sub_action" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar,
        "status" boolean,
        "module_id" integer,
        "action_id" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" integer,
        "createdBy" integer
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "status" boolean,
        "organization_id" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" integer,
        "createdBy" integer
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_module_access" (
        "id" SERIAL PRIMARY KEY,
        "organization_id" integer,
        "role_id" integer,
        "module_id" integer,
        "action_id" integer,
        "sub_action_id" integer,
        "is_access" boolean DEFAULT true
      )
    `);

    // Deliberately missing every column added by a later migration (see
    // class comment) — most importantly "organization_id", which
    // CreateDefaultAdminUser populates and CommunityAppSchemaMigration later
    // migrates into "membership" and drops.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
        "firstName" varchar NOT NULL,
        "lastName" varchar,
        "email" varchar,
        "dob" date,
        "phone" varchar,
        "password" varchar,
        "role" varchar NOT NULL DEFAULT 'user',
        "roleId" integer,
        "docs" jsonb,
        "emailVerificationToken" varchar,
        "resetPasswordToken" varchar,
        "resetPasswordExpires" timestamptz,
        "refreshToken" varchar,
        "isActive" boolean NOT NULL DEFAULT false,
        "external_user" boolean DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "fcm_token" varchar,
        "organization_id" integer,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "country" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "code_number" integer NOT NULL,
        "official_language" varchar,
        "continent_name" varchar NOT NULL,
        CONSTRAINT "UQ_country_code_number" UNIQUE ("code_number")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_address" (
        "id" SERIAL PRIMARY KEY,
        "user_id" uuid NOT NULL,
        "address_type" varchar,
        "full" varchar,
        "country_id" integer,
        "street" varchar,
        "address_line_1" varchar,
        "address_line_2" varchar,
        "province" varchar,
        "city" varchar,
        "zip_code" varchar,
        "lat" float,
        "lng" float,
        "is_default" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_bank_account" (
        "id" SERIAL PRIMARY KEY,
        "bank_owner_name" varchar,
        "bank_account_number" varchar,
        "bank_account_code" varchar,
        "is_active" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_module_subscription" (
        "id" SERIAL PRIMARY KEY,
        "organizationId" integer,
        "moduleId" integer,
        "term" varchar DEFAULT 'short',
        "price" decimal DEFAULT 0,
        "startDate" date,
        "endDate" date
      )
    `);
  }

  public async down(): Promise<void> {
    // Intentionally one-directional, same as CommunityAppSchemaMigration —
    // reverting a baseline schema migration means dropping the database's
    // entire working schema, which is never what you want from `migration:
    // revert`. Restore from a backup instead.
  }
}
