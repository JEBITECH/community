"use client";

import {
  clearSession,
  getAccessToken,
  isTokenExpired,
  setAccessToken,
} from "./tokens";

/**
 * Normalized API error.
 *
 * The backend emits several different error shapes and a client that only
 * handles one will surface "undefined" to users:
 *   - gateway JWT guard:  { message: "Unauthorized, token is expired or invalid" }
 *   - community-svc:      { statusCode, message, code, path, method, timestamp }
 *   - auth-svc handlers:  { error: "Invalid credentials" }
 *   - Joi validation:     { error: "Validation error", details: [...] }
 *   - class-validator:    { message: "Invalid body...", errors: [...] }
 */
export class ApiError extends Error {
  readonly status: number;
  /** Backend error code (`TENANT_MISMATCH`, `CAPACITY_EXCEEDED`, ...) when present. */
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RawErrorBody {
  message?: string | string[];
  error?: string | { message?: string };
  code?: string;
  statusCode?: number;
  details?: unknown;
  errors?: unknown;
}

function extractMessage(body: RawErrorBody | null, status: number): string {
  if (!body) return fallbackMessage(status);

  const { message, error } = body;

  if (Array.isArray(message) && message.length) return message.join(", ");
  if (typeof message === "string" && message) return message;
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object" && typeof error.message === "string") {
    return error.message;
  }

  return fallbackMessage(status);
}

function fallbackMessage(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have access to this.";
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many attempts. Please wait a moment.";
  if (status >= 500) return "Something went wrong on our end. Please retry.";
  return "Request failed.";
}

// ---------------------------------------------------------------------------
// Single-flight refresh
// ---------------------------------------------------------------------------

/**
 * Concurrent 401s must not fire N refresh calls: auth-svc rotates the stored
 * refresh token on every use, so parallel refreshes would invalidate each
 * other and log the user out. All callers await the same in-flight promise.
 */
let refreshInFlight: Promise<string | null> | null = null;

/** Set by AuthProvider so an unrecoverable 401 can tear down app state. */
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: (() => void) | null): void {
  onAuthFailure = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      // The refresh token rides along as an httpOnly cookie (same-origin via
      // the Next rewrite), so no body is needed. auth-svc accepts either.
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });

      if (!res.ok) return null;

      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) return null;

      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      // Release the latch on the next tick so late awaiters still see this run.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Appended as a query string; null/undefined/"" entries are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip the Authorization header (public endpoints). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  // Always same-origin: next.config.ts rewrites /api/* to the gateway. This
  // keeps us clear of CORS and lets the refresh cookie flow.
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.append(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function execute<T>(
  path: string,
  options: RequestOptions,
  attemptedRefresh: boolean,
): Promise<T> {
  const { method = "GET", body, query, anonymous, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!anonymous) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: "include",
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.ok) {
    return (await parseBody(res)) as T;
  }

  // A 401 on an authenticated call means the access token lapsed. Refresh once
  // and replay; if that fails the session is genuinely over.
  if (res.status === 401 && !anonymous && !attemptedRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return execute<T>(path, options, true);
    }
    clearSession();
    onAuthFailure?.();
  }

  const raw = (await parseBody(res)) as RawErrorBody | null;
  const isObject = raw !== null && typeof raw === "object";

  throw new ApiError(
    extractMessage(isObject ? raw : null, res.status),
    res.status,
    isObject ? raw.code : undefined,
    isObject ? (raw.details ?? raw.errors) : undefined,
  );
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // Pre-emptive refresh: if the token is already past expiry, renew before
  // spending a round trip on a guaranteed 401.
  if (!options.anonymous) {
    const token = getAccessToken();
    if (token && isTokenExpired(token)) {
      await refreshAccessToken();
    }
  }

  return execute<T>(path, options, false);
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "PATCH", body }),

  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "PUT", body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/** Best-effort message for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
