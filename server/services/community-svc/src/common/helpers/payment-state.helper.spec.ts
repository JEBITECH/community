import { ApiError } from '@shared/common';
import { assertValidPaymentTransition, generateReceiptNumber } from './payment-state.helper';

function captureError(fn: () => void): ApiError {
  try {
    fn();
  } catch (err) {
    return err as ApiError;
  }
  throw new Error('Expected assertValidPaymentTransition to throw, but it did not');
}

describe('assertValidPaymentTransition', () => {
  it('allows pending -> recorded', () => {
    expect(() => assertValidPaymentTransition('pending', 'recorded')).not.toThrow();
  });

  it('allows pending -> failed', () => {
    expect(() => assertValidPaymentTransition('pending', 'failed')).not.toThrow();
  });

  it('allows failed -> pending (retry) and failed -> recorded', () => {
    expect(() => assertValidPaymentTransition('failed', 'pending')).not.toThrow();
    expect(() => assertValidPaymentTransition('failed', 'recorded')).not.toThrow();
  });

  it('rejects recorded -> failed: recorded is terminal', () => {
    const err = captureError(() => assertValidPaymentTransition('recorded', 'failed'));
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects recorded -> pending: recorded is terminal', () => {
    const err = captureError(() => assertValidPaymentTransition('recorded', 'pending'));
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects a same-status no-op transition', () => {
    const err = captureError(() => assertValidPaymentTransition('pending', 'pending'));
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects an unknown current status defensively', () => {
    const err = captureError(() => assertValidPaymentTransition('bogus', 'recorded'));
    expect(err.statusCode).toBe(409);
  });
});

describe('generateReceiptNumber', () => {
  it('prefixes the receipt number as requested', () => {
    expect(generateReceiptNumber('DON')).toMatch(/^DON-/);
    expect(generateReceiptNumber('SPN')).toMatch(/^SPN-/);
  });

  it('produces distinct values on successive calls', () => {
    const receipts = new Set(Array.from({ length: 20 }, () => generateReceiptNumber('DON')));
    expect(receipts.size).toBe(20);
  });
});
