import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiError } from '@shared/common';
import { ROLES_KEY } from '../decorators/roles.decorator';

const MASTER_ADMIN = 'master_admin';

/**
 * Coarse role gate for admin-surface endpoints. Master Admin always passes —
 * it's the platform-level role and isn't org-scoped, so it never appears in a
 * per-endpoint @Roles(...) allowlist but must still be able to act.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ApiError('Authentication required', 401, 'UNAUTHENTICATED');
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (user.role === MASTER_ADMIN || requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ApiError('You do not have permission to perform this action', 403, 'FORBIDDEN');
  }
}
