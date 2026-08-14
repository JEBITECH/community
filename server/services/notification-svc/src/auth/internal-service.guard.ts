import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-internal-service-token'] as string;
    const expectedToken = process.env.INTERNAL_SERVICE_KEY;

    if (!expectedToken) {
      throw new UnauthorizedException('Internal service token not configured');
    }

    if (!token) {
      throw new UnauthorizedException('Missing x-internal-service-token header');
    }

    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedToken);

    if (tokenBuffer.length !== expectedBuffer.length) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    if (!timingSafeEqual(tokenBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    return true;
  }
}
