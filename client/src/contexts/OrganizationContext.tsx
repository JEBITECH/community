import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getMyMemberships, switchOrganization } from "@/features/shared/api/memberships";
import { getOrganizations } from "@/features/shared/api/organizations";

interface OrganizationThemeConfig {
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
}

interface MembershipOrganization {
  id: number;
  organization_name: string;
  organization_email: string;
  organization_location: string;
  organization_logo?: string;
  subdomain: string;
  themeConfig?: OrganizationThemeConfig | null;
}

interface Membership {
  id: string;
  organization_id: number;
  role: string;
  member_type: string;
  status: string;
  is_default: boolean;
  organization: MembershipOrganization;
}

interface Organization {
  id: number;
  name: string;
  email: string;
  location: string;
}

interface OrganizationContextValue {
  selectedOrganizationId: number | null;
  setSelectedOrganizationId: (id: number) => void;
  selectedOrganization: Organization | undefined;
  organizations: Organization[];
  memberships: Membership[];
  activeMembership: Membership | undefined;
  isLoadingOrganizations: boolean;
  isSuperAdmin: boolean;
  isMasterAdmin: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, updateToken } = useAuth();
  const isMasterAdmin = (user as any)?.role === "master_admin";

  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedOrganizationId");
    return saved ? parseInt(saved) : null;
  });

  // Master Admin is platform-level (no personal org membership) but can browse/"view
  // as" any organization, so it gets the full cross-tenant list instead.
  const { data: allOrganizationsData, isLoading: isLoadingAllOrganizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
    enabled: isAuthenticated && isMasterAdmin,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: membershipsData, isLoading: isLoadingMemberships } = useQuery({
    queryKey: ["my-memberships"],
    queryFn: getMyMemberships,
    enabled: isAuthenticated && !isMasterAdmin,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const memberships: Membership[] = membershipsData?.memberships || [];
  const isLoadingOrganizations = isMasterAdmin ? isLoadingAllOrganizations : isLoadingMemberships;

  const organizations: Organization[] = isMasterAdmin
    ? (allOrganizationsData?.organization_list || []).map((org: any) => ({
        id: org.organization_id,
        name: org.organization_name,
        email: org.organization_email,
        location: org.organization_location,
      }))
    : memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.organization_name,
        email: m.organization.organization_email,
        location: m.organization.organization_location,
      }));

  const activeMembership =
    memberships.find((m) => m.organization_id === selectedOrganizationId) ||
    memberships.find((m) => m.is_default) ||
    memberships[0];

  const isSuperAdmin = activeMembership?.role === "super_admin";
  const selectedOrganization = organizations.find((org) => org.id === selectedOrganizationId);

  // Keep the selected org in sync with the available list (first load, or if the
  // previously-selected org is no longer valid for this user).
  useEffect(() => {
    if (organizations.length === 0) return;
    const stillValid = organizations.some((org) => org.id === selectedOrganizationId);
    if (stillValid) return;

    const next = isMasterAdmin
      ? organizations[0]
      : (memberships.find((m) => m.is_default) || memberships[0]);
    const nextId = isMasterAdmin ? (next as Organization).id : (next as Membership)?.organization_id;

    if (nextId) {
      setSelectedOrganizationIdState(nextId);
      localStorage.setItem("selectedOrganizationId", nextId.toString());
    }
  }, [organizations, memberships, isMasterAdmin, selectedOrganizationId]);

  const setSelectedOrganizationId = useCallback((id: number) => {
    setSelectedOrganizationIdState(id);
    localStorage.setItem("selectedOrganizationId", id.toString());

    // Master Admin's org selection is a local "view as" pick, not a membership —
    // there's no membership to switch, so skip the token re-mint call.
    if (isMasterAdmin) return;

    // Re-mints the JWT scoped to the new org so subsequent API calls (and
    // ACL checks) carry the right organizationId/role claim.
    switchOrganization(id)
      .then((result) => {
        if (result?.accessToken) {
          updateToken(result.accessToken);
        }
      })
      .catch(() => {
        // Non-fatal: the UI stays on the newly-selected org locally even if
        // the token re-mint call fails; the next request will surface any
        // real authorization problem.
      });
  }, [updateToken, isMasterAdmin]);

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganizationId,
        setSelectedOrganizationId,
        selectedOrganization,
        organizations,
        memberships,
        activeMembership,
        isLoadingOrganizations,
        isSuperAdmin,
        isMasterAdmin,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganizationContext must be used within OrganizationProvider");
  return ctx;
}
