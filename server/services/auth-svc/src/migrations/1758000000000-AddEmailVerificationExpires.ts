import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationExpires1758000000000 implements MigrationInterface {
    name = 'AddEmailVerificationExpires1758000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Use raw SQL with IF NOT EXISTS check (PostgreSQL)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = 'emailVerificationExpires'
                ) THEN
                    ALTER TABLE "users" ADD "emailVerificationExpires" timestamptz;
                END IF;
            END $$;
        `);
        
        console.log('✅ emailVerificationExpires column check complete (added if missing)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Use raw SQL with IF EXISTS check (PostgreSQL)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = 'emailVerificationExpires'
                ) THEN
                    ALTER TABLE "users" DROP COLUMN "emailVerificationExpires";
                END IF;
            END $$;
        `);
        
        console.log('✅ emailVerificationExpires column removed (if existed)');
    }
}
