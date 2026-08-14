import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId?: string;
  transactionId?: string;
  userId?: string;
  organizationId?: string;

  // ip?: string;
  // Add any other request-scoped data you need
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext(
  context: RequestContext,
  callback: () => void
) {
  asyncLocalStorage.run(context, callback);
}

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function getTransactionId(): string | undefined {
  return getRequestContext()?.transactionId;
}

export function getRequestId(): string | undefined {
  return getRequestContext()?.requestId;
}

export function getOrganizationId(): string | undefined {
  return getRequestContext()?.organizationId;
}
