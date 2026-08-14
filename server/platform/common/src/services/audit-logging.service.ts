
import { Repository } from "typeorm";
import { ApiLogs } from "../entity/api-logs.enitity";
import { AppDataSource } from "../db";
import { AuditTransaction } from "../entity/audit-transaction.entity";
import { TransactionStatus } from "../enums/transaction-status.enum";

export class AuditLogState {
    static lastRequestId: string = "";
    static lastTransactionId: string = ""; // static field
}

export class AuditLogging {
    private apiRepository: Repository<ApiLogs>;
    private auditTransactionRepo: Repository<AuditTransaction>
    constructor() {
        this.apiRepository = AppDataSource.getRepository(ApiLogs);
        this.auditTransactionRepo = AppDataSource.getRepository(AuditTransaction);
    }

    async persistAPILogs(data: Record<string, any>) {
        const { requestId, transactionId, statusCode, responseTimeMs } = data;

        // Skip if requestId is missing or invalid
        if (!requestId || requestId === 'undefined') {
            console.log('[AUDIT] Skipping log - no valid requestId');
            return;
        }

        // Ensure responseTimeMs is a valid number
        const validResponseTime = !isNaN(responseTimeMs) && responseTimeMs >= 0 ? responseTimeMs : 0;

        if (AuditLogState.lastRequestId != requestId) {
            const existingApiLog = await this.apiRepository.findOne({ where: { request_id: requestId } });
            if (!existingApiLog) {
                const apiLogData: any = {
                    request_id: requestId,
                    method: data.method,
                    path: data.path,
                    status_code: statusCode,
                    response_timeMs: validResponseTime,
                    error_message: data.errorMessage ? data.errorMessage : '',
                    stack_trace: data.stackTrace ? data.stackTrace : '',
                    microservice_name: data.microservicesName || null,
                    created_by: data.userId || null,
                    organization_id: data.organizationId
                };

                // Only include transaction_id if it exists, otherwise let DB use default
                if (transactionId) {
                    apiLogData.transaction_id = transactionId;
                }

                const apiLogs = this.apiRepository.create(apiLogData);
                this.apiRepository.save(apiLogs).then().catch();
                AuditLogState.lastRequestId = requestId;
            }
        }

        // Only log transaction if transactionId exists and is valid
        if (transactionId && transactionId !== 'undefined' && AuditLogState.lastTransactionId != transactionId) {
            const existtingTransactionLogs = await this.auditTransactionRepo.findOne({ where: { transaction_id: transactionId } });
            if (!existtingTransactionLogs) {
                const auditTransaction = this.auditTransactionRepo.create({
                    transaction_id: data.transactionId,
                    organization_id: data.organizationId ?? null,
                    // user_id: data.userId ?? null,
                    // transaction_type: data.method,
                    transaction_status: data.statusCode > 299 ? TransactionStatus.FAILURE : TransactionStatus.SUCCESS,
                    // started_at: 67,// Number((Date.now() - data.response_timeMs).toFixed(3)),
                    // ended_at: 67, // Number(Date.now().toFixed(3)),
                    enable_logging: true,
                });
                this.auditTransactionRepo.save(auditTransaction).then().catch();
                AuditLogState.lastTransactionId = transactionId
            }
        }
    }

}

