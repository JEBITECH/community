import { ApiError } from '@shared/common';
import { RequestUser } from '../middleware/user-context.middleware';

const MASTER_ADMIN = 'master_admin';

/**
 * Enforces tenant isolation: the resource's organization must match the
 * caller's active-membership organization. Master Admin is the only role
 * allowed to cross tenants (platform dashboards/admin), and only implicitly
 * here — callers that need cross-tenant access should simply not call this
 * helper, keeping the bypass explicit at the call site rather than silent
 * inside a shared guard.
 */
export function assertTenantMatch(resourceOrganizationId: number, user: RequestUser): void {
  if (user.role === MASTER_ADMIN) {
    return;
  }
  if (user.organization_id == null || user.organization_id !== resourceOrganizationId) {
    throw new ApiError('You do not have access to this organization\'s data', 403, 'TENANT_MISMATCH');
  }
}
