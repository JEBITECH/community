import { Catch, ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Request, Response } from "express";
import { ApiError } from "../errors/ApiError";
import { QueryFailedError, EntityNotFoundError } from "typeorm";
import { errorHandler } from "../middlewares/errorHandler";

/**
 * ApiExceptionFilter for nest js microservices
 */
@Catch(ApiError, QueryFailedError, EntityNotFoundError, Error)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    errorHandler(err, req, res, undefined as any);
  }
}
