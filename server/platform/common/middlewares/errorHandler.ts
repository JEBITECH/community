// server/middlewares/errorHandler.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../errors/ApiError';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { HttpException } from '@nestjs/common';
import pino from 'pino';
import { ApiLogs } from '../src/entity/api-logs.enitity';
import { AuditLogging } from '../src/services/audit-logging.service';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Global error handling middleware for Express microservices
 * 
 * @param err 
 * @param req 
 * @param res 
 * @param next 
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {

  if (res.headersSent) {
    return next(err);
    console.log('error handler in headersSent')
  }
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let path = req.url;
  const requestId = req.headers['x-request-id'] as string;
  const startTime = Number(req.headers['x-request-start-time']);
  const responseTime = Date.now() - startTime;
  const serviceName = req.headers['service-name'];
  let transactionId;
  if (req.headers['transaction-id']) {
    transactionId = req.headers['transaction-id'];
  }
  const userId = req.headers['x-user-id'];
  const microservicesName = req.headers['service-name'];
  const organizationId = req.headers['x-user-organization-id'];


  console.log('error handler, responseTime : ', responseTime)

  if (err instanceof ApiError) {
    console.log('[error ApiError  ]');
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    path = err.path ?? req.url; // use path from ApiError if set
  } else if (err instanceof HttpException) {
    statusCode = err.getStatus();
    const response = err.getResponse();
    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      message = (response as any).message || err.message;
      if (Array.isArray(message)) {
        message = (message as string[]).join(', ');
      }
    }
    code = statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 409 ? 'CONFLICT' : 'HTTP_ERROR';
  } else if (err instanceof QueryFailedError) {
    statusCode = 422;
    message = 'Database query failed';
    code = 'QUERY_FAILED';
  } else if (err instanceof EntityNotFoundError) {
    console.log('[error EntityNotFoundError  ]', {
      requestId: req.headers['x-request-id'],
      startTime: req.headers['x-request-start-time']
    });
    statusCode = 404;
    message = 'Entity not found';
    code = 'ENTITY_NOT_FOUND';
  } else if (err instanceof Error) {
    message = err.message;
    code = 'UNKNOWN_ERROR';
  }

  try {
    console.log('error handler called : errorMessage : ', message, 'err.stack : ', err.stack, 'err.statusCode: ', err.statusCode)
    const data = {
      requestId: requestId,
      method: req.method,
      path: req.path,
      statusCode: err.statusCode,
      responseTimeMs: responseTime,
      errorMessage: message,
      stackTrace: err instanceof Error ? err.stack : "",
      transactionId: transactionId,
      userId: userId,
      microservicesName: microservicesName,
      organizationId: organizationId
    }
    const auditService = new AuditLogging();
    auditService.persistAPILogs(data);

  } catch (err) {
    console.error(" Failed to save error log:", err);
  }


  logger.error(
    {
      method: req.method,
      path,
      stack: err instanceof Error ? err.stack : null,
    },
    message
  );

  res.status(statusCode).json({
    statusCode,
    message,
    code,
    path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};
