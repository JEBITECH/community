import { DataSource } from 'typeorm';

/**
 * Simple TTL cache (max 500 entries, 60s TTL) — replaces lru-cache to avoid
 * dependency version mismatch in containerised environments.
 */
class SimpleTTLCache {
  private cache = new Map<string, { value: boolean; expires: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(opts: { max: number; ttl: number }) {
    this.maxSize = opts.max;
    this.ttl = opts.ttl;
  }

  get(key: string): boolean | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: boolean): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expires: Date.now() + this.ttl });
  }
}

const domainCache = new SimpleTTLCache({ max: 500, ttl: 60_000 });

const PLATFORM_ALLOWED_DOMAINS = [
  '*.virtueinspect.com',
  'virtueinspect.com',
  'localhost',
  '127.0.0.1',
];

/**
 * Checks whether the given origin belongs to a known platform domain.
 * Supports wildcard subdomain matching (e.g. *.virtueinspect.com matches
 * any subdomain of virtueinspect.com as well as virtueinspect.com itself).
 */
export function isPlatformDomain(origin: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  return PLATFORM_ALLOWED_DOMAINS.some((allowed) => {
    if (allowed.startsWith('*.')) {
      const base = allowed.slice(2);
      return hostname === base || hostname.endsWith('.' + base);
    }
    return hostname === allowed;
  });
}

/**
 * Checks whether the given origin is listed in any organization's allowed_domains.
 * Uses an LRU cache (max 500 entries, 60s TTL) to avoid hitting the database on
 * every CORS preflight request. Falls back to querying the organization table when
 * the cache does not contain the origin.
 */
async function isOrganizationAllowedDomain(dataSource: DataSource, origin: string): Promise<boolean> {
  const cached = domainCache.get(origin);
  if (cached !== undefined) {
    return cached;
  }

  // If DataSource is not initialized, reject gracefully
  if (!dataSource.isInitialized) {
    return false;
  }

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    domainCache.set(origin, false);
    return false;
  }

  try {
    // allowed_domains is a JSON column containing an array of strings
    const result = await dataSource.query(
      `SELECT id FROM organization WHERE allowed_domains IS NOT NULL AND (allowed_domains::jsonb ? $1 OR allowed_domains::jsonb ? $2) LIMIT 1`,
      [hostname, origin]
    );

    const allowed = result.length > 0;
    domainCache.set(origin, allowed);
    return allowed;
  } catch {
    // DB query failed — reject but don't cache the failure
    return false;
  }
}

/**
 * Creates a dynamic CORS origin resolver for the gateway.
 * Returns a callback-based function compatible with the `cors` package's `origin` option.
 *
 * Behavior:
 * - No origin (server-to-server or same-origin requests): allows via `true`
 * - Platform domain match: allows via the exact origin string
 * - Organization allowed_domains match: allows via the exact origin string
 * - Otherwise: rejects via `false`
 */
export function createCorsOriginResolver(dataSource: DataSource) {
  return async (origin: string | undefined, callback: (err: Error | null, allow?: string | boolean) => void) => {
    // No origin (server-to-server, same-origin) — allow
    if (!origin) {
      return callback(null, true);
    }

    // Platform domains always allowed
    if (isPlatformDomain(origin)) {
      return callback(null, origin);
    }

    // Check organization allowed_domains
    const allowed = await isOrganizationAllowedDomain(dataSource, origin);
    if (allowed) {
      return callback(null, origin);
    }

    // Not allowed
    callback(null, false);
  };
}
