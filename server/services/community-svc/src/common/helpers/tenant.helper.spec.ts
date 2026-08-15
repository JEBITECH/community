import { ApiError } from '@shared/common';
import { assertTenantMatch } from './tenant.helper';
import { RequestUser } from '../middleware/user-context.middleware';

function user(overrides: Partial<RequestUser>): RequestUser {
  return { id: 'user-1', email: 'a@b.com', role: 'internal_member', organization_id: 1, ...overrides };
}

describe('assertTenantMatch', () => {
  it('allows access when the resource org matches the caller org', () => {
    expect(() => assertTenantMatch(1, user({ organization_id: 1 }))).not.toThrow();
  });

  it('rejects access when the resource org differs from the caller org', () => {
    expect(() => assertTenantMatch(2, user({ organization_id: 1 }))).toThrow(ApiError);
    try {
      assertTenantMatch(2, user({ organization_id: 1 }));
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(403);
      expect((err as ApiError).code).toBe('TENANT_MISMATCH');
    }
  });

  it('rejects a caller with no active organization membership', () => {
    expect(() => assertTenantMatch(1, user({ organization_id: null }))).toThrow(ApiError);
  });

  it('lets master_admin bypass tenant checks entirely, even with no org', () => {
    expect(() => assertTenantMatch(1, user({ role: 'master_admin', organization_id: null }))).not.toThrow();
    expect(() => assertTenantMatch(999, user({ role: 'master_admin', organization_id: 1 }))).not.toThrow();
  });
});
