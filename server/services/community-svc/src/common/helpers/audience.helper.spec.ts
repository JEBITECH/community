import { ApiError } from '@shared/common';
import { EventAudience } from '../../events/entities/event.entity';
import { assertGuestAudienceAllowed, resolveEffectiveAudience } from './audience.helper';

describe('resolveEffectiveAudience', () => {
  const event: { audience: EventAudience } = { audience: 'internal' };

  it('falls back to the event when neither day nor component override it', () => {
    expect(resolveEffectiveAudience(event, null, null)).toBe('internal');
    expect(resolveEffectiveAudience(event, { audience: undefined }, undefined)).toBe('internal');
  });

  it('uses the day override when the component does not override it', () => {
    const day = { audience: 'public' };
    expect(resolveEffectiveAudience(event, day, null)).toBe('public');
    expect(resolveEffectiveAudience(event, day, { audience: undefined })).toBe('public');
  });

  it('prefers the component override over both day and event', () => {
    const day = { audience: 'public' };
    const component = { audience: 'invite_only' };
    expect(resolveEffectiveAudience(event, day, component)).toBe('invite_only');
  });

  it('prefers the component override even when the day has no override', () => {
    const component = { audience: 'invite_only' };
    expect(resolveEffectiveAudience(event, null, component)).toBe('invite_only');
  });
});
