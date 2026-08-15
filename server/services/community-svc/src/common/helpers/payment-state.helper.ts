import { ApiError } from '@shared/common';

/**
 * Enforces the donation/sponsorship payment state machine at the service
 * layer, not just via column values: pending -> recorded or pending ->
 * failed only. 'recorded' is terminal — a correction requires an explicit
 * admin "reverse" action (not built in this pass), so this rejects
 * recorded -> anything outright rather than allowing a stray PATCH to
 * silently un-record a payment.
 */
export function assertValidPaymentTransition(current: string, next: string): void {
  const allowed: Record<string, string[]> = {
    pending: ['recorded', 'failed'],
    failed: ['pending', 'recorded'],
  };

  if (current === next) {
    throw new ApiError(`Payment is already "${current}"`, 409, 'INVALID_STATUS_TRANSITION');
  }
  if (!allowed[current]?.includes(next)) {
    throw new ApiError(`Cannot change payment status from "${current}" to "${next}"`, 409, 'INVALID_STATUS_TRANSITION');
  }
}

export function generateReceiptNumber(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
