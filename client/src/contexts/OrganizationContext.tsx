import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useOrganizations } from "@/erp/features/organization-management/hooks/getOrganizations";
import { useAuth } from "@/hooks/useAuth";

interface UserWithOrganization {
  id: string;
  role: string;
  organization_id: number;
}

interface Organization {
  id: number;
  name: string;
  email: string;
  location: string;
  superAdminName: string;
  isFranchisor: boolean;
}

interface OrganizationContextValue {
  selectedOrganizationId: number | null;
  setSelectedOrganizationId: (id: number) => void;
  selectedOrganization: Organization | undefined;
  organizations: Organization[];
  isLoadingOrganizations: boolean;
  isSuperAdmin: boolean;
  isMasterAdmin: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userWithOrg = user as unknown as UserWithOrganization;
  const isSuperAdmin = userWithOrg?.role === "super_admin";
  const isMasterAdmin = (user as any)?.role === "platformOwner";

  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedOrganizationId");
    return saved ? parseInt(saved) : null;
  });

  const { data: organizationsList, isLoading: isLoadingOrganizations } = useOrganizations(isAuthenticated);

  const organizations: Organization[] = (organizationsList?.organization_list || []).map((org: any) => ({
    id: org.organization_id,
    name: org.organization_name,
    email: org.organization_email,
    location: org.organization_location,
    superAdminName: org.super_admin_name,
    isFranchisor: org.is_franchisor === true,
  }));

  const selectedOrganization = organizations.find((org) => org.id === selectedOrganizationId);

  // Auto-select on load
  useEffect(() => {
    if (organizations.length === 0) return;

    let orgId: number | null = null;

    // For non-platformOwner users, ALWAYS use their organization_id from login
    if (!isMasterAdmin && userWithOrg?.organization_id) {
      const userOrg = organizations.find((o) => o.id === userWithOrg.organization_id);
      orgId = userOrg ? userOrg.id : organizations[0].id;
    }

    // For platformOwner, try localStorage first, then fall back to first org
    if (isMasterAdmin) {
      const saved = localStorage.getItem("selectedOrganizationId");
      if (saved) {
        const savedId = parseInt(saved);
        if (organizations.find((o) => o.id === savedId)) {
          orgId = savedId;
        } else {
          localStorage.removeItem("selectedOrganizationId");
        }
      }
      if (!orgId) {
        orgId = organizations[0].id;
      }
    }

    // Fall back to first org if nothing matched
    if (!orgId) {
      orgId = organizations[0].id;
    }

    if (orgId !== selectedOrganizationId) {
      setSelectedOrganizationIdState(orgId);
      localStorage.setItem("selectedOrganizationId", orgId.toString());
    }
  }, [organizations.length, isSuperAdmin, isMasterAdmin, userWithOrg?.organization_id]);

  const setSelectedOrganizationId = useCallback((id: number) => {
    setSelectedOrganizationIdState(id);
    localStorage.setItem("selectedOrganizationId", id.toString());
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganizationId,
        setSelectedOrganizationId,
        selectedOrganization,
        organizations,
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
