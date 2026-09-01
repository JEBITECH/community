import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Mail,
  MapPin,
  Palette,
  Phone,
  Users,
  Boxes,
  Globe,
} from "lucide-react";
import {
  getOrganizationById,
  getModulesByOrganizationId,
} from "@/features/shared/api/organizations";
import { getUserByOrganizationId } from "@/erp/features/user-management/api";

interface OrganizationUsersResponse {
  users?: Array<{
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
  }>;
}

function formatPlan(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const organizationId = Number(id);

  const organizationQuery = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => getOrganizationById(organizationId),
    enabled: Number.isInteger(organizationId) && organizationId > 0,
  });

  const modulesQuery = useQuery({
    queryKey: ["organization-modules", organizationId],
    queryFn: () => getModulesByOrganizationId(organizationId),
    enabled: Number.isInteger(organizationId) && organizationId > 0,
  });

  const usersQuery = useQuery<OrganizationUsersResponse>({
    queryKey: ["organization-users", organizationId],
    queryFn: () => getUserByOrganizationId(organizationId),
    enabled: Number.isInteger(organizationId) && organizationId > 0,
  });

  const organization = organizationQuery.data;
  const members = usersQuery.data?.users ?? [];
  const enabledModuleIds = new Set((organization?.modules ?? []).map((module) => module.id));
  const moduleUsage = modulesQuery.data?.module_list ?? [];
  const enabledModules = moduleUsage.filter((module) => enabledModuleIds.has(module.module_id));

  if (organizationQuery.isLoading) {
    return (
      <Layout title="Organization" subtitle="Loading organization details..." icon={<Building2 className="w-5 h-5" />}>
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!organization || organizationQuery.isError) {
    return (
      <Layout title="Organization" subtitle="The organization could not be loaded." icon={<Building2 className="w-5 h-5" />}>
        <div className="max-w-5xl mx-auto py-6 px-4">
          <Link to="/platform-dashboard">
            <Button variant="outline" shape="pill" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Platform Dashboard
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={organization.organization_name}
      subtitle="Organization profile, membership, plan, and enabled modules"
      icon={<Building2 className="w-5 h-5" />}
    >
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/platform-dashboard">
            <Button variant="ghost" shape="pill" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link to={`/organizations/${organization.organization_id}/edit`}>
              <Button variant="outline" shape="pill">Edit Organization</Button>
            </Link>
            <Link to="/subscription-plans">
              <Button variant="outline" shape="pill" className="gap-2">
                <CreditCard className="w-4 h-4" /> Compare Plans
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">{organization.organization_name}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge>{formatPlan(organization.plan)}</Badge>
                  <Badge variant={organization.organization_status === "suspended" ? "destructive" : "default"}>
                    {organization.organization_status}
                  </Badge>
                  {organization.is_archived && <Badge variant="outline">Archived</Badge>}
                </div>
              </div>
              <div
                className="h-14 w-14 rounded-xl border"
                title="Primary theme color"
                style={{ backgroundColor: organization.themeConfig?.primary_color || "#2563eb" }}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3"><MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Location</p><p className="text-sm">{organization.organization_location || "—"}</p></div></div>
              <div className="flex gap-3"><Globe className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Subdomain</p><p className="text-sm">{organization.subdomain || "—"}</p></div></div>
              <div className="flex gap-3"><Mail className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Contact Email</p><p className="text-sm">{organization.organization_email || "—"}</p></div></div>
              <div className="flex gap-3"><Phone className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Contact Phone</p><p className="text-sm">{organization.organization_contact_info || "—"}</p></div></div>
              <div className="flex gap-3"><Palette className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Theme</p><p className="text-sm">{organization.themeConfig?.primary_color || "—"} / {organization.themeConfig?.secondary_color || "—"}</p></div></div>
              <div className="flex gap-3"><Users className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Membership Model</p><p className="text-sm">{formatPlan(organization.membership_model)}</p></div></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Members</CardTitle></CardHeader>
            <CardContent>
              {usersQuery.isLoading ? <Skeleton className="h-24 w-full" /> : (
                <>
                  <p className="text-3xl font-semibold">{members.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Users associated with this organization.</p>
                  <div className="mt-4 space-y-2 max-h-56 overflow-auto">
                    {members.slice(0, 8).map((member) => (
                      <div key={member.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{[member.firstName, member.lastName].filter(Boolean).join(" ") || "Unnamed user"}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email || member.phone || "No contact"}</p>
                        </div>
                        <Badge variant={member.isActive ? "default" : "outline"}>{member.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    ))}
                    {members.length > 8 && <p className="text-xs text-muted-foreground">Showing 8 of {members.length} members.</p>}
                    {members.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Boxes className="w-4 h-4" /> Module Usage</CardTitle></CardHeader>
            <CardContent>
              {modulesQuery.isLoading ? <Skeleton className="h-24 w-full" /> : (
                <>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-semibold">{enabledModules.length}</p>
                    <p className="text-sm text-muted-foreground pb-1">enabled modules</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Optional feature modules enabled for this organization; action counts come from the organization module-access endpoint.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {enabledModules.map((module) => (
                      <div key={module.module_id} className="rounded-lg border p-2">
                        <p className="text-sm font-medium truncate">{module.name}</p>
                        <p className="text-xs text-muted-foreground">{module.action_list?.length ?? 0} actions</p>
                      </div>
                    ))}
                    {enabledModules.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">No optional modules enabled.</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> Subscription</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Plan</p><p className="text-sm font-medium">{formatPlan(organization.plan)}</p></div>
            <div><p className="text-xs text-muted-foreground">Module subscriptions</p><p className="text-sm font-medium">{organization.moduleSubscriptions?.length ?? 0}</p></div>
            <div><p className="text-xs text-muted-foreground">Super Admin</p><p className="text-sm font-medium">{organization.super_admin_name || "—"}</p><p className="text-xs text-muted-foreground">{organization.super_admin_email || ""}</p></div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
