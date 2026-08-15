import { ApiError } from '@shared/common';
import { assertGuestAudienceAllowed } from './audience.helper';

describe('assertGuestAudienceAllowed', () => {
  it.each(['public', 'internal_external'])('allows guest participation for audience=%s', (audience) => {
    expect(() => assertGuestAudienceAllowed(audience)).not.toThrow();
  });

  it.each(['internal', 'invite_only'])('rejects guest participation for audience=%s', (audience) => {
    expect(() => assertGuestAudienceAllowed(audience)).toThrow(ApiError);
    try {
      assertGuestAudienceAllowed(audience);
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(403);
      expect((err as ApiError).code).toBe('AUDIENCE_RESTRICTED');
    }
  });

  it('rejects an unrecognized audience value defensively', () => {
    expect(() => assertGuestAudienceAllowed('made_up_value')).toThrow(ApiError);
  });
});
