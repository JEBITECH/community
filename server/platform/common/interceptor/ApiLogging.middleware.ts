import { Request, Response, NextFunction } from 'express';

// import { context } from './context';
import { ApiLogs } from '../src/entity/api-logs.enitity';
import { AuditLogging } from '../src/services/audit-logging.service';

/**
 * Express middleware replacement for ApiLoggingInterceptor
 */
export function apiLoggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const requestId = req.headers['x-request-id'] as string;
    // If header doesn't exist or is invalid, use current timestamp
    const headerStartTime = Number(req.headers['x-request-start-time']);
    const startTime = !isNaN(headerStartTime) && headerStartTime > 0 ? headerStartTime : Date.now();

    let transactionId: string;
    if (req.headers['transaction-id']) {
        transactionId = req.headers['transaction-id'] as string;
    }
    const userId = req.headers['x-user-id'];
    const microservicesName = req.headers['service-name'];
    const organizationId = req.headers['x-user-organization-id'];

    // Hook into response finish event (AFTER controller)
    res.on('finish', async () => {
        const responseTime = Date.now() - startTime;
        const data = {
            requestId: requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTimeMs: responseTime,
            transactionId: transactionId,
            userId: userId,
            microservicesName: microservicesName,
            organizationId: organizationId

        }
        const auditService = new AuditLogging();
        auditService.persistAPILogs(data);
    });
    next();


}
