import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();

        // Read values from gateway headers
        const requestId =
            request.headers['x-request-id'];

        const startTime =
            Number(request.headers['x-request-start-time']);
        console.log('[INTERCEPTOR - BEFORE]', {
            requestId,
            startTime,
            url: request.url

        });

        // Continue controller execution
        return next.handle().pipe(

            // Runs AFTER controller/service
            tap(() => {

                const responseTime = Date.now() - startTime;
                const statusCode = response.statusCode;

                // Example: persist api_log
                console.log('[ApiLoggingInterceptor After ]', {
                    requestId,
                    responseTime,
                    statusCode,
                    url: request.url,
                });

                // APILogRepo.save(...) & APITransaction
            }),
        );
    }
}