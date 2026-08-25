import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';

export type ChatVisibility = 'internal_only' | 'internal_and_external' | 'admin_only';

const ADMIN_ROLES = ['super_admin', 'core_committee', 'master_admin'];

/** Shared gate for both EventComment and EventChatMessage — a config's
 * who_can_view/who_can_post setting is checked the same way regardless of
 * which surface (REST comment thread, live chat) is asking. */
export function assertChatAccess(visibility: ChatVisibility, membership: Membership, userRole: string, action: 'view' | 'post'): void {
  if (ADMIN_ROLES.includes(userRole)) {
    return;
  }
  if (visibility === 'admin_only') {
    throw new ApiError(`Only organizers can ${action} here`, 403, 'FORBIDDEN');
  }
  if (visibility === 'internal_only' && membership.member_type !== 'internal') {
    throw new ApiError(`Only internal members can ${action} here`, 403, 'FORBIDDEN');
  }
}
