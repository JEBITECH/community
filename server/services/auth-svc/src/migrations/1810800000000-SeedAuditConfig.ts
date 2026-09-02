import { MigrationInterface, QueryRunner } from 'typeorm';

const ENTITY_NAMES = ['Event', 'Donation', 'Sponsorship', 'Membership'];

export class SeedAuditConfig1810800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clean up accidental duplicates before enforcing one config row per
    // organization/entity pair. The lowest id is retained.
    await queryRunner.query(`
      DELETE FROM audit_config duplicate
      USING audit_config keeper
      WHERE duplicate.id > keeper.id
        AND duplicate.organization_id = keeper.organization_id
        AND duplicate.entity_name = keeper.entity_name
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_audit_config_org_entity"
      ON audit_config (organization_id, entity_name)
    `);

    for (const entityName of ENTITY_NAMES) {
      await queryRunner.query(`
        INSERT INTO audit_config
          (organization_id, entity_name, log_insert, log_update, log_delete, enabled)
        SELECT id, $1, TRUE, TRUE, TRUE, TRUE
        FROM organization
        ON CONFLICT (organization_id, entity_name) DO NOTHING
      `, [entityName]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM audit_config
      WHERE entity_name IN ('Event', 'Donation', 'Sponsorship', 'Membership')
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_audit_config_org_entity"`);
  }
}
