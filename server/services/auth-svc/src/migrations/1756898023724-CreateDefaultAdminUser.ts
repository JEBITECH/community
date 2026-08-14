import { MigrationInterface, QueryRunner } from "typeorm";

const bcrypt = require('bcryptjs');

export class CreateDefaultAdminUser1756898023724 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = "admin@localhost.com";
    const roleName = "platformOwner";
    const organizationName = "jebitech";

    // Check if required tables exist (they should be created by synchronize)
    const rolesTableExists = await queryRunner.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      )`
    );

    if (!rolesTableExists[0].exists) {
      console.log("⚠️ Tables not yet created. Skipping migration - will run after synchronize.");
      return;
    }

    // Check if masterAdmin already exists
    const existingUser = await queryRunner.query(
      `SELECT * FROM "users" WHERE "email" = $1`,
      [email]
    );

    if (existingUser.length > 0) {
      console.log("ℹ️ masterAdmin already exists, skipping insertion.");
      return;
    }

    //organization
    const existingOrganization = await queryRunner.query(
      `SELECT * FROM "organization" WHERE "organization_name" = $1`,
      [organizationName]
    );
    if (existingOrganization.length > 0) {
      console.log("ℹ️ organization already exists, skipping insertion.");

    } else {
      const organization = await queryRunner.query(
        `INSERT INTO "organization" (
         "organization_name", "organization_email", "organization_location"
      ) VALUES (
         $1, $2, $3
      )`,
        [
          organizationName,
          email,
          "India"
        ]
      );
    }
    const organizationResult = await queryRunner.query(
      `SELECT * FROM "organization" WHERE "organization_name" = $1 LIMIT 1`,
      [organizationName]
    );
    const organizationId = organizationResult[0].id;
    console.log('organizationId : ', organizationId);


    //Role
    const existingRole = await queryRunner.query(
      `SELECT * FROM "roles" WHERE "name" = $1`,
      [roleName]
    );

    if (existingRole.length > 0) {
      console.log("ℹ️ Role for masterAdmin already exists, skipping insertion.");

    } else {
      const roles = await queryRunner.query(
        `INSERT INTO "roles" (
         "name", "status", "createdAt", "updatedAt", "createdBy", "updatedBy", "organization_id"
      ) VALUES (
         $1, true, now(), now(), $2, $3, $4
      )`,
        [
          roleName,
          null,
          null,
          organizationId
        ]
      );
      console.log('roles : ', roles);
    }

    const roleResult = await queryRunner.query(
      `SELECT * FROM "roles" WHERE "name" = $1 LIMIT 1`,
      [roleName]
    );
    const roleId = roleResult[0].id;
    console.log('roleId : ', roleId);

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password = await bcrypt.hash('Admin@123', salt);

    // Insert masterAdmin user
    await queryRunner.query(
      `INSERT INTO "users" (
        "id", "firstName", "lastName", "email", "phone", "password", "role",
        "emailVerificationToken", "roleId","organization_id", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        $7, $8, $9, true, now(), now()
      )`,
      [
        "Master",                          // firstName
        "Admin",                          // lastName
        email,                            // email
        "0000000000",                     // phone
        password,                         // hashed password
        "platformOwner",                     // role
        null,                                // emailVerificationToken
        roleId,
        organizationId
      ]
    );

    console.log("✅ masterAdmin user inserted");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = $1`,
      ["superadmin@example.com"]
    );
    console.log("🗑️ masterAdmin user deleted");
  }

}
