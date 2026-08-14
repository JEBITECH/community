import { MigrationInterface, QueryRunner } from "typeorm";

const bcrypt = require('bcryptjs');

export class SeedSystemWorkerUser1798136923594 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = "worker@jebitech.com";
    const passwordPlain = "SuperSecurePassword123";
    const roleName = "worker";
    const organizationName = "jebitech";

    // Check if user already exists
    const existingUser = await queryRunner.query(
      `SELECT * FROM "users" WHERE "email" = $1`,
      [email]
    );
    if (existingUser.length > 0) {
      console.log("ℹ️ SYSTEM worker already exists, skipping insertion.");
      return;
    }

    // Get organization
    const organizationResult = await queryRunner.query(
      `SELECT * FROM "organization" WHERE "organization_name" = $1 LIMIT 1`,
      [organizationName]
    );
    if (organizationResult.length === 0) {
      throw new Error("Organization 'jebitech' not found. Please run the admin user migration first.");
    }
    const organizationId = organizationResult[0].id;
    let roleId: number;

    // Get role
    const roleResult = await queryRunner.query(
      `SELECT * FROM "roles" WHERE "name" = $1 LIMIT 1`,
      [roleName]
    );

    if (roleResult.length === 0) {
      const insertedRoles  = await queryRunner.query(
        `INSERT INTO "roles" (
         "name", "status", "createdAt", "updatedAt", "createdBy", "updatedBy", "organization_id"
      ) VALUES (
         $1, true, now(), now(), $2, $3, $4
      )
      RETURNING id`,
        [
          roleName,
          null,
          null,
          organizationId
        ]
      );
      console.log('roles : ', insertedRoles);
      roleId = insertedRoles[0].id;

    } else {
      console.log("ℹ️ Role for SYSTEM worker already exists, skipping insertion.");
      roleId = roleResult[0].id;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password = await bcrypt.hash(passwordPlain, salt);

    // Insert worker user
    await queryRunner.query(
      `INSERT INTO "users" (
        "id", "firstName", "lastName", "email", "phone", "password", "role",
        "emailVerificationToken", "roleId", "organization_id", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        $7, $8, $9, true, now(), now()
      )`,
      [
        "System", // firstName
        "Worker", // lastName
        email,
        "0000000000",
        password,
        roleName,
        null,
        roleId,
        organizationId
      ]
    );
    console.log("✅ SYSTEM worker user inserted");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = $1`,
      ["worker@jebitech.com"]
    );
    console.log("🗑️ SYSTEM worker user deleted");
  }
}
