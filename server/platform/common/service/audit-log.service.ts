// audit-log.service.ts
import Bottleneck from "bottleneck";
import { AuditLogs } from "../src/entity/audit-logs.entity";
import { DataSource, Repository } from "typeorm";
import { getOrganizationId, getRequestId, getTransactionId, getUserId } from "../request.context";
import { AuditConfig } from "../src/entity/audit-config.entity";

export class AuditLogService {
  private limiter: Bottleneck;

  private configMap =
    new Map<string, AuditConfig>();

  private instanceId: number;

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 200,
      reservoir: 100,
      reservoirRefreshAmount: 100,
      reservoirRefreshInterval: 60 * 1000,
    });
  }

  async loadAuditConfig(
    AppDataSource: DataSource
  ) {

    const repo =
      AppDataSource.getRepository(AuditConfig);

    const configs =
      await repo.find();

    configs.forEach(cfg => {

      const key =
        `${cfg.organization_id}_${cfg.entity_name}`;

      this.configMap.set(key, cfg);

    });
  }

  async reloadAuditConfig(
    AppDataSource: DataSource
  ) {

    this.configMap.clear();

    const repo =
      AppDataSource.getRepository(AuditConfig);

    const configs =
      await repo.find();

    configs.forEach(cfg => {

      const key =
        `${cfg.organization_id}_${cfg.entity_name}`;

      this.configMap.set(key, cfg);

    });

  }

  log(payload: Partial<AuditLogs>, AppDataSource: DataSource) {
    payload.request_id = getRequestId();
    payload.transaction_id = getTransactionId();
    payload.user_id = getUserId();

    const orgContext = getOrganizationId();
    const orgId = orgContext ? Number(orgContext) : NaN;
    if (!Number.isInteger(orgId) || orgId <= 0) {
      return;
    }

    payload.organization_id = orgId;
    const entityName = payload.entity_name;
    if (!entityName) return;

    // Do the DB lookup inside the rate-limited job. This makes the in-memory
    // cache self-healing when a new organization is created after a service
    // started (each microservice has its own process-local cache).
    this.limiter
      .schedule(async () => {
        const config = await this.getConfig(orgId, entityName, AppDataSource);
        if (!this.shouldLog(config, payload.operation)) return;
        await this.persist(payload, AppDataSource.getRepository(AuditLogs));
      })
      .catch((err) => console.error("Audit log failed", err));
  }

  /**
   * Persists audit data on the same TypeORM transaction/connection that
   * triggered the subscriber. This prevents audit rows being committed when
   * the business transaction later rolls back.
   */
  async logInTransaction(payload: Partial<AuditLogs>, manager: any): Promise<void> {
    payload.request_id = getRequestId();
    payload.transaction_id = getTransactionId();
    payload.user_id = getUserId();

    const orgContext = getOrganizationId();
    const orgId = orgContext ? Number(orgContext) : NaN;
    if (!Number.isInteger(orgId) || orgId <= 0 || !payload.entity_name) {
      return;
    }

    payload.organization_id = orgId;
    const config = await this.getConfig(orgId, payload.entity_name, manager.connection);
    if (!this.shouldLog(config, payload.operation)) return;

    const repo = manager.getRepository(AuditLogs);
    await repo.save(repo.create(payload));
  }

  private shouldLog(config: AuditConfig | undefined, operation: AuditLogs["operation"] | undefined): boolean {
    if (!config?.enabled || !operation) return false;
    if (operation === "INSERT") return config.log_insert;
    if (operation === "UPDATE") return config.log_update;
    if (operation === "REMOVE") return config.log_delete;
    return false;
  }

  private async getConfig(
    organizationId: number,
    entityName: string,
    dataSource: DataSource,
  ): Promise<AuditConfig | undefined> {
    const key = `${organizationId}_${entityName}`;
    const cached = this.configMap.get(key);
    if (cached) return cached;

    const config = await dataSource.getRepository(AuditConfig).findOne({
      where: { organization_id: organizationId, entity_name: entityName },
    });
    if (config) {
      this.configMap.set(key, config);
    }
    return config ?? undefined;
  }

  logWithPrisma(payload: Partial<any>, prisma: any) {
    payload.request_id = getRequestId();
    payload.transaction_id = getTransactionId();
    payload.organization_id = Number(getOrganizationId());

    this.limiter
      .schedule(() => this.persistWithPrisma(payload, prisma))
      .catch((err) => console.error("Audit log failed", err));
  }

  private async persist(
    payload: Partial<AuditLogs>,
    auditLogsRepository: Repository<AuditLogs>
  ) {
    try {
      await auditLogsRepository.save(auditLogsRepository.create(payload));
    } catch (error) {
      console.error("Failed to save audit log:", error);
    }
  }

  private async persistWithPrisma(payload: Partial<any>, prisma: any) {
    try {
      await prisma.auditLogs.create({ data: payload });
    } catch (error) {
      console.error("Failed to save audit log:", error);
    }
  }
}
