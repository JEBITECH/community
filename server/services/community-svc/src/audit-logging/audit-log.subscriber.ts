import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { AuditLogs, auditService } from '@shared/common';

/**
 * Audit subscriber for entities persisted by community-svc.
 *
 * Important: this uses event.manager rather than a separate DataSource so the
 * audit row participates in the same DB transaction as the business write.
 */
@EventSubscriber()
export class CommunityAuditLogSubscriber implements EntitySubscriberInterface<any> {
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    await this.log(event, 'INSERT');
  }

  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    await this.log(event, 'UPDATE');
  }

  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    await this.log(event, 'REMOVE');
  }

  private async log(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    operation: AuditLogs['operation'],
  ): Promise<void> {
    const entity = event.entity ?? (event as RemoveEvent<any>).databaseEntity;
    const entityId = event.entity?.id ?? (event as any).entityId ?? (event as RemoveEvent<any>).databaseEntity?.id;
    if (!entity && !entityId) return;

    const entityName = event.metadata.name;
    if (
      entityName === 'AuditLogs' ||
      entityName === 'ApiLogs' ||
      entityName === 'AuditTransaction' ||
      entityName === 'AuditConfig'
    ) {
      return;
    }

    const oldValues =
      operation === 'UPDATE' && (event as UpdateEvent<any>).databaseEntity
        ? instanceToPlain((event as UpdateEvent<any>).databaseEntity)
        : undefined;

    try {
      await auditService.logInTransaction(
        {
          entity_name: entityName,
          entity_id: String(entityId),
          operation,
          new_values: operation === 'REMOVE' ? undefined : instanceToPlain(entity),
          old_values: operation === 'UPDATE' || operation === 'REMOVE' ? (oldValues ?? instanceToPlain(entity)) : oldValues,
        },
        event.manager,
      );
    } catch (error) {
      // Audit failure should fail the business transaction: silently losing a
      // required audit trail is worse than surfacing the database error.
      throw error;
    }
  }
}
