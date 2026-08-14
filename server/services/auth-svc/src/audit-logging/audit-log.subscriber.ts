// audit-log.subscriber.ts
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from "typeorm";
// import { DataSource } from "typeorm";
import { AppDataSource } from "../db";
import { AuditLogService } from '@shared/common';
import { instanceToPlain } from 'class-transformer';
import { auditService } from "@shared/common";

@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface<any> {
  // private auditService: AuditLogService;

  constructor() {
    // Initialize the service with the data source
    // this.auditService = new AuditLogService();
  }

  private async getOldSnapshot(event: any): Promise<any | null> {
    if (this.isUpdateEvent(event) && event.databaseEntity) {
      return instanceToPlain(event.databaseEntity);
    }
  }
  private isUpdateEvent(event: any): event is UpdateEvent<any> {
    return (
      !!event &&
      'databaseEntity' in event &&
      typeof event.databaseEntity !== 'undefined'
    );
  }


  afterInsert(event: InsertEvent<any>) {
    this.log(event, "INSERT",);
  }

  afterUpdate(event: UpdateEvent<any>) {
    this.log(event, "UPDATE");
  }

  afterRemove(event: RemoveEvent<any>) {
    this.log(event, "REMOVE");
  }

  private async log(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    // action: string
    action: 'INSERT' | 'UPDATE' | 'REMOVE',

  ) {
    if (!event.entity) return;

    if (
      event.metadata.name === "AuditLogs" ||
      event.metadata.name === "ApiLogs" ||
      event.metadata.name === "AuditTransaction"
    ) {
      return;
    }
    const oldValues =
      action === 'UPDATE' ? await this.getOldSnapshot(event) : null;
    // const newValues = action === 'DELETE' ? null : this.getNewSnapshot(event);
    auditService.log(
      {
        entity_name: event.metadata.name,
        entity_id: event.entity.id || event["entityId"],
        operation: action as 'INSERT' | 'UPDATE' | 'REMOVE',
        new_values: event.entity,
        old_values: oldValues
      }, AppDataSource as any);
  }
}
