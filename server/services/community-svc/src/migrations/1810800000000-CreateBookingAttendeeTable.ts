import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingAttendeeTable1810800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "booking_attendee" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "booking_id" uuid NOT NULL,
        "attendee_type" varchar NOT NULL,
        "name" varchar NOT NULL,
        "membership_id" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_booking_attendee" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_attendee_booking" FOREIGN KEY ("booking_id")
          REFERENCES "booking" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_attendee_booking_id" ON "booking_attendee" ("booking_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_attendee"`);
  }
}
