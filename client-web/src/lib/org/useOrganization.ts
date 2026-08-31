"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import type { PublicOrganization } from "@/lib/api/types";

/**
 * Resolves which community this deployment serves.
 *
 * Preference order:
 *   1. NEXT_PUBLIC_COMMUNITY_SUBDOMAIN (explicit, for single-tenant deploys)
 *   2. the first hostname label, so societyname.example.com "just works"
 *
 * localhost and IP hosts yield null, in which case the join screen asks for an
 * invitation code instead of assuming an organization.
 */
export function resolveSubdomain(): string | null {
  const configured = process.env.NEXT_PUBLIC_COMMUNITY_SUBDOMAIN?.trim();
  if (configured) return configured;

  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return null;
  }

  const [first, ...rest] = host.split(".");
  if (rest.length < 2) return null; // "example.com" has no subdomain
  if (first === "www") return null;

  return first;
}

/**
 * Public organization lookup: supplies the header's name and logo, and the
 * organization id the join flow needs. Unauthenticated, so it works before
 * any session exists.
 */
export function useOrganization() {
  const subdomain = resolveSubdomain();

  return useQuery<PublicOrganization | null>({
    queryKey: ["public-organization", subdomain],
    enabled: subdomain !== null,
    queryFn: () =>
      subdomain
        ? authApi.organizationBySubdomain(subdomain)
        : Promise.resolve(null),
    staleTime: 10 * 60 * 1000,
    // A missing/suspended org is a 404 and will never succeed on retry.
    retry: false,
  });
}
