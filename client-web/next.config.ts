import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

/**
 * Config lives in the repo-root .env — there is deliberately no .env file
 * inside this package.
 *
 * Next only auto-loads .env from the app directory, so the three variables this
 * app needs are lifted out of the root file here. Only those three are read:
 * the root file also holds DB credentials, JWT secrets and SMTP passwords, and
 * none of that belongs in the web server's environment.
 *
 * Precedence is process.env first, so Docker build args and compose's
 * `env_file:` always win and the file is simply absent inside the image.
 */
const ROOT_ENV = resolve(process.cwd(), "..", ".env");

const CLIENT_WEB_KEYS = [
  "GATEWAY_URL",
  "NEXT_PUBLIC_COMMUNITY_WS_URL",
  "NEXT_PUBLIC_COMMUNITY_SUBDOMAIN",
] as const;

type ClientWebKey = (typeof CLIENT_WEB_KEYS)[number];

function readRootEnv(): Partial<Record<ClientWebKey, string>> {
  let contents: string;
  try {
    contents = readFileSync(ROOT_ENV, "utf8");
  } catch {
    // Expected inside Docker, where the root file isn't in the build context
    // and values arrive through build args / env_file instead.
    return {};
  }

  const wanted = new Set<string>(CLIENT_WEB_KEYS);
  const out: Partial<Record<ClientWebKey, string>> = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!wanted.has(key)) continue;

    // Strip one layer of matching quotes; leave the value otherwise intact.
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }

    out[key as ClientWebKey] = value;
  }

  return out;
}

const rootEnv = readRootEnv();

/** process.env wins; the root file is the fallback. */
function envValue(key: ClientWebKey): string {
  return process.env[key] ?? rootEnv[key] ?? "";
}

// Seed GATEWAY_URL so the rewrite below can keep reading it off process.env at
// request time (which is what lets Docker point it at an internal hostname).
if (!process.env.GATEWAY_URL && rootEnv.GATEWAY_URL) {
  process.env.GATEWAY_URL = rootEnv.GATEWAY_URL;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a minimal, self-contained server bundle under .next/standalone
  // so the production Docker image stays small and doesn't need the full
  // node_modules tree at runtime.
  output: "standalone",

  // Inlined into the browser bundle at build time. Declared explicitly because
  // these come from the root .env rather than a local one, so Next's own env
  // loader never sees them.
  env: {
    NEXT_PUBLIC_COMMUNITY_WS_URL: envValue("NEXT_PUBLIC_COMMUNITY_WS_URL"),
    NEXT_PUBLIC_COMMUNITY_SUBDOMAIN: envValue("NEXT_PUBLIC_COMMUNITY_SUBDOMAIN"),
  },

  // The community website talks to the same gateway as the admin client.
  //
  // Proxying /api/* through the Next server (rather than calling the gateway
  // cross-origin from the browser) buys two things:
  //   1. No CORS preflight, and no need to add this origin to the gateway's
  //      dynamic CORS allowlist.
  //   2. The refresh token is delivered by auth-svc as an httpOnly cookie
  //      (Path=/, SameSite=Lax, Secure=false). Same-origin requests send it
  //      back automatically; a cross-site XHR would not.
  async rewrites() {
    const gateway = process.env.GATEWAY_URL || "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${gateway}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
