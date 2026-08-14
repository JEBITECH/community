// audit-log.service.ts
import Bottleneck from "bottleneck";
import { AuditLogs } from "../src/entity/audit-logs.entity";
import { DataSource, Repository } from "typeorm";
import { getOrganizationId, getRequestId, getTransactionId } from "../request.context";
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
    const auditLogsRepository = AppDataSource.getRepository(AuditLogs);
    // Schedule a rate-limited persistence
    payload.request_id = getRequestId();
    payload.transaction_id = getTransactionId();
    const orgId = Number(getOrganizationId());
    payload.organization_id = orgId;
    const entityName =
      payload.entity_name;

    const action =
      payload.operation;

    const key =
      `${orgId}_${entityName}`;

    const config =
      this.configMap.get(key);

    if (!config?.enabled) {
      return;
    }

    if (
      action === "INSERT" &&
      !config.log_insert
    ) return;

    if (
      action === "UPDATE" &&
      !config.log_update
    ) return;

    if (
      action === "REMOVE" &&
      !config.log_delete
    ) return;

    this.limiter
      .schedule(async () => this.persist(payload, auditLogsRepository))
      .catch((err) => console.error("Audit log failed", err));
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
