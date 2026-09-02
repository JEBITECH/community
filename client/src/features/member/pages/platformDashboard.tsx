import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  CalendarDays, 
  Gift, 
  Plus, 
  MoreVertical, 
  Edit, 
  PauseCircle, 
  PlayCircle, 
  Archive, 
  RotateCcw,
  Search,
  CreditCard,
} from "lucide-react";
import { usePlatformSummary } from "../hooks/useDashboard";
import { 
  getOrganizations, 
  suspendOrganization, 
  reactivateOrganization, 
  archiveOrganization, 
  restoreOrganization 
} from "@/features/shared/api/organizations";

interface OrganizationItem {
  organization_id: number;
  organization_name: string;
  subdomain: string;
  organization_status: string;
  is_archived: boolean;
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlatformDashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: summary, isLoading: isSummaryLoading } = usePlatformSummary();

  const { data: orgsData, isLoading: isOrgsLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
    queryClient.invalidateQueries({ queryKey: ["platformSummary"] });
  };

  const suspendMut = useMutation({ mutationFn: suspendOrganization, onSuccess: invalidateQueries });
  const reactivateMut = useMutation({ mutationFn: reactivateOrganization, onSuccess: invalidateQueries });
  const archiveMut = useMutation({ mutationFn: archiveOrganization, onSuccess: invalidateQueries });
  const restoreMut = useMutation({ mutationFn: restoreOrganization, onSuccess: invalidateQueries });

  const organizations: OrganizationItem[] = (orgsData?.organization_list ?? []).filter((org) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [org.organization_name, org.subdomain, org.organization_status]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <Layout title="Platform Dashboard" subtitle="Across every community on the platform" icon={<ShieldCheck className="w-5 h-5" />}>
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        
        <div className="flex flex-wrap justify-between gap-2">
          <Link to="/subscription-plans">
            <Button variant="outline" shape="pill" className="gap-1">
              <CreditCard className="w-4 h-4" /> Plans
            </Button>
          </Link>
          <Link to="/organizations/new">
            <Button shape="pill" className="gap-1">
              <Plus className="w-4 h-4" /> New Organization
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search organizations by name, subdomain, or status"
            className="pl-9"
            aria-label="Search organizations"
          />
        </div>

        {isSummaryLoading || !summary ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Organizations"
              value={summary.organizations.total}
              icon={Building2}
              sub={`${summary.organizations.active} active · ${summary.organizations.suspended} suspended`}
            />
            <StatCard label="Total Members" value={summary.members_total} icon={Users} />
            <StatCard label="Events" value={summary.events.total} icon={CalendarDays} sub={`${summary.events.published} published`} />
            <StatCard label="Donations Recorded" value={`₹${summary.donations_total_recorded.toLocaleString("en-IN")}`} icon={Gift} />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Manage Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isOrgsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : organizations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No organizations found.</div>
            ) : (
              <div className="divide-y divide-border">
                {organizations.map((org) => {
                  const orgId = org.organization_id;
                  const status = org.organization_status;

                  return (
                    <div key={orgId} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/organizations/${orgId}`} className="font-medium text-foreground hover:underline">{org.organization_name}</Link>
                          <Badge variant={status === "suspended" ? "destructive" : org.is_archived ? "outline" : "default"}>
                            {org.is_archived ? "Archived" : status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{org.subdomain}.yourdomain.com</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          
                          {/* Route directly to organizationSettings.tsx */}
                          <DropdownMenuItem asChild>
                            <Link to={`/organizations/${orgId}/edit`} className="cursor-pointer flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Edit Details
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />

                          {status === "suspended" ? (
                            <DropdownMenuItem onClick={() => reactivateMut.mutate(orgId)} className="cursor-pointer text-green-600 gap-2">
                              <PlayCircle className="w-4 h-4" /> Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => suspendMut.mutate(orgId)} className="cursor-pointer text-amber-600 gap-2">
                              <PauseCircle className="w-4 h-4" /> Suspend
                            </DropdownMenuItem>
                          )}

                          {org.is_archived ? (
                            <DropdownMenuItem onClick={() => restoreMut.mutate(orgId)} className="cursor-pointer gap-2">
                              <RotateCcw className="w-4 h-4" /> Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => archiveMut.mutate(orgId)} className="cursor-pointer text-destructive gap-2">
                              <Archive className="w-4 h-4" /> Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}