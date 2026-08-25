import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';
import { assertChatAccess } from './chat-permission.helper';

function membership(memberType: 'internal' | 'external'): Membership {
  return { member_type: memberType } as Membership;
}

describe('assertChatAccess', () => {
  it('always allows admin roles regardless of visibility setting', () => {
    for (const role of ['super_admin', 'core_committee', 'master_admin']) {
      expect(() => assertChatAccess('admin_only', membership('external'), role, 'post')).not.toThrow();
    }
  });

  it('blocks non-admins when visibility is admin_only', () => {
    expect(() => assertChatAccess('admin_only', membership('internal'), 'internal_member', 'view')).toThrow(ApiError);
    try {
      assertChatAccess('admin_only', membership('internal'), 'internal_member', 'post');
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(403);
      expect((err as ApiError).code).toBe('FORBIDDEN');
    }
  });

  it('blocks external members when visibility is internal_only', () => {
    expect(() => assertChatAccess('internal_only', membership('external'), 'external_member', 'view')).toThrow(ApiError);
  });

  it('allows internal members when visibility is internal_only', () => {
    expect(() => assertChatAccess('internal_only', membership('internal'), 'internal_member', 'view')).not.toThrow();
  });

  it('allows both internal and external members when visibility is internal_and_external', () => {
    expect(() => assertChatAccess('internal_and_external', membership('internal'), 'internal_member', 'post')).not.toThrow();
    expect(() => assertChatAccess('internal_and_external', membership('external'), 'external_member', 'post')).not.toThrow();
  });
});
