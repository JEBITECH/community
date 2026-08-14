import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import OrganizationSetupForm from "../components/OrganizationsSetupForm";
import { useOrganizations } from "../hooks/getOrganizations";
import { useOrganizationById } from "../hooks/getOrganizationsById";
import Layout from "@/components/Layout";
import { Building, GitBranch, Crown, MapPin } from "lucide-react";
import { useLocation } from "react-router-dom";
import AccordionView from "../components/AccordionVIew";
import { OrganizationData } from "../utils/types";
import { Card, CardContent } from "@/components/ui/card";

export default function OrganizationManagement() {
  const { toast } = useToast();
  const { isAuthenticated, loading, user } = useAuth();
  const { data: organizationsList, isLoading, refetch: refetchOrganization } = useOrganizations();

  // Detect navigation from Organization listings
  const location = useLocation();
  const navState = (location.state as { parentId?: number; mode?: string; parentName?: string; orgId?: number } | null);
  const franchiseeMode = navState?.mode === 'franchisee';
  const parentOrgId = navState?.parentId ?? null;
  const franchiseeParentName = navState?.parentName;

  // Edit / View mode navigated from Organization listings
  const targetOrgId = (navState?.mode === 'edit' || navState?.mode === 'view') ? navState.orgId : undefined;
  const isViewMode = navState?.mode === 'view';
  const { data: targetOrgData, refetch: refetchTargetOrg } = useOrganizationById(targetOrgId ? String(targetOrgId) : '');

  // Is the target org a child of a parent org?
  const hasParentOrg = !!(targetOrgData?.parent_org_id);

  // When user clicks Edit inside AccordionView while in view mode, switch to edit form
  const [editOrgData, setEditOrgData] = useState<OrganizationData | null>(null);
  const [openEditForm, setOpenEditForm] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, loading, toast]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  const setupForm = (
    <OrganizationSetupForm
      organizations={organizationsList?.organization_list || []}
      refetchOrganization={refetchOrganization}
      isLoading={isLoading}
      currentUserOrgId={user?.organization_id}
      franchiseeMode={franchiseeMode}
      parentOrgId={parentOrgId}
      franchiseeParentName={franchiseeParentName}
      initialEditData={openEditForm ? editOrgData : (targetOrgData ?? null)}
      isViewMode={false}
    />
  );

  // View mode: show AccordionView (same as org listings) for the single org
  // If the user clicks Edit inside AccordionView, switch to the edit form
  const viewContent = isViewMode && targetOrgData && !openEditForm ? (
    <AccordionView
      data={[targetOrgData]}
      setEditOrganization={setEditOrgData}
      setIsEdit={setOpenEditForm}
      refetchOrganizations={refetchTargetOrg}
    />
  ) : (
    setupForm
  );

  // Parent-org info banner — shown when viewing/editing an org that has a parent org
  const ParentOrgBanner = () => {
    if (!hasParentOrg || !targetOrgData) return null;
    return (
      <Card className="border-0 shadow-md bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {targetOrgData.organization_logo ? (
              <img
                src={targetOrgData.organization_logo}
                alt={`${targetOrgData.organization_name} logo`}
                className="h-14 w-14 rounded-lg border border-border object-contain bg-white p-1 shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <GitBranch className="w-7 h-7 text-primary" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-lg text-card-foreground truncate">
                  {targetOrgData.organization_name}
                </span>
                {targetOrgData.is_franchisor && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/30 shrink-0">
                    <Crown className="w-3 h-3" />
                    Parent Organization
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {targetOrgData.organization_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {targetOrgData.organization_location}
                  </span>
                )}
                {targetOrgData.parent_org_id && (
                  <span className="flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    Parent Org ID: <span className="font-mono font-medium text-foreground ml-1">{targetOrgData.parent_org_id}</span>
                    {navState?.parentName && (
                      <span className="ml-1 text-foreground font-medium">({navState.parentName})</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout title="Organization Management" subtitle="Configure and manage your organizations" icon={<Building className="h-8 w-8" />}>
      <div className="bg-background min-h-full">
        <div className="p-6 space-y-6">
          <ParentOrgBanner />

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {viewContent}
          </div>
        </div>
      </div>
    </Layout>
  );
}
