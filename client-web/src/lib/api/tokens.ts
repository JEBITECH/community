"use client";

import type { AccessTokenClaims } from "./types";

/**
 * Access-token storage.
 *
 * localStorage matches the admin client, and is a deliberate trade-off: it
 * survives reloads but is readable by any script on the origin. The refresh
 * token is NOT kept here -- auth-svc issues it as an httpOnly cookie and,
 * because the browser talks to the Next server on the same origin (see the
 * /api rewrite in next.config.ts), it is replayed automatically and stays
 * invisible to JS.
 */
const ACCESS_TOKEN_KEY = "community.accessToken";
const USER_KEY = "community.user";

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    // Private-mode Safari and hardened browser configs throw on access.
    return null;
  }
}

export function getAccessToken(): string | null {
  return safeLocalStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function setAccessToken(token: string): void {
  safeLocalStorage()?.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearSession(): void {
  const store = safeLocalStorage();
  store?.removeItem(ACCESS_TOKEN_KEY);
  store?.removeItem(USER_KEY);
}

export function readStoredJson<T>(key: string): T | null {
  const raw = safeLocalStorage()?.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  try {
    safeLocalStorage()?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode -- non-fatal, the session just won't persist.
  }
}

export const STORAGE_KEYS = { user: USER_KEY } as const;

/**
 * Decodes the JWT payload WITHOUT verifying it. Only ever used to read the
 * active org/role for rendering and to pre-empt an expiry; every real
 * authorization decision is made server-side.
 */
export function decodeAccessToken(
  token: string | null,
): AccessTokenClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

/** True when the token is missing, unparseable, or within `skewSeconds` of expiry. */
export function isTokenExpired(token: string | null, skewSeconds = 30): boolean {
  const claims = decodeAccessToken(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
