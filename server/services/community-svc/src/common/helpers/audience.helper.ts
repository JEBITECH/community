import { ApiError } from '@shared/common';
import { Event } from '../../events/entities/event.entity';
import { EventDay } from '../../events/entities/event-day.entity';
import { EventComponent } from '../../events/entities/event-component.entity';

const GUEST_ALLOWED_AUDIENCES = ['public', 'internal_external'];

/** Guards every /public/* mutating endpoint: a guest with no membership may
 * only act on events/components whose audience explicitly permits external
 * participation, never 'internal' or 'invite_only'. */
export function assertGuestAudienceAllowed(audience: string): void {
  if (!GUEST_ALLOWED_AUDIENCES.includes(audience)) {
    throw new ApiError('This event is not open to public participation', 403, 'AUDIENCE_RESTRICTED');
  }
}

/**
 * The single source of truth for "which audience value actually governs
 * this component / day / event". Resolution order, most specific wins:
 *   1. component.audience, if the component overrides it
 *   2. day.audience, if the day overrides it
 *   3. event.audience, the default every event always has
 */
export function resolveEffectiveAudience(
  event: Pick<Event, 'audience'>,
  day: Pick<EventDay, 'audience'> | null | undefined,
  component: Pick<EventComponent, 'audience'> | null | undefined,
): string {
  return component?.audience ?? day?.audience ?? event.audience;
}