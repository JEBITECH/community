// src/common/guards/roles.guard.ts

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { Role } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
    ) { }

    canActivate(
        context: ExecutionContext,
    ): boolean {

        // Get required roles from decorator
        const requiredRoles =
            this.reflector.getAllAndOverride<Role[]>(
                'roles',
                [
                    context.getHandler(),
                    context.getClass(),
                ],
            );
        // If no roles defined → allow
        if (!requiredRoles) {
            return true;
        }

        // Get request
        const request =
            context.switchToHttp().getRequest();
        let user = request.user;
        if (!user) {

            const headerUser =
                request.headers['x-user'];

            if (headerUser) {

                try {

                    user =
                        typeof headerUser === 'string'
                            ? JSON.parse(headerUser)
                            : headerUser;

                    // request.user = user;

                } catch {

                    throw new ForbiddenException(
                        'Invalid x-user header format',
                    );

                }

            }
        }


        if (!user) {
            throw new ForbiddenException(
                'User not found in request',
            );
        }

        // Check if user role matches
        const hasRole =
            requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException(
                'You do not have permission',
            );
        }

        return true;
    }
}