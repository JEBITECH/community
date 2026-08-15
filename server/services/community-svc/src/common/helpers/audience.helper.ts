import { ApiError } from '@shared/common';

const GUEST_ALLOWED_AUDIENCES = ['public', 'internal_external'];

/** Guards every /public/* mutating endpoint: a guest with no membership may
 * only act on events/components whose audience explicitly permits external
 * participation, never 'internal' or 'invite_only'. */
export function assertGuestAudienceAllowed(audience: string): void {
  if (!GUEST_ALLOWED_AUDIENCES.includes(audience)) {
    throw new ApiError('This event is not open to public participation', 403, 'AUDIENCE_RESTRICTED');
  }
}
