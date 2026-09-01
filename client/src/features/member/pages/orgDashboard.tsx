import { useNavigate } from "react-router-dom";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Gift,
  HeartHandshake,
  HandHeart,
  Clock,
  FileBarChart,
} from "lucide-react";
import { useOrgSummary } from "../hooks/useDashboard";

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

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useOrgSummary();
  const { activeMembership } = useOrganizationContext();

  return (
    <Layout title="Dashboard" subtitle="How your community is doing" icon={<LayoutDashboard className="w-5 h-5" />}>
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        <div className="flex justify-end">
          <div className="flex gap-2">
            {activeMembership?.role === "super_admin" && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/organizations/${activeMembership.organization_id}/edit`)}>
                Organization Settings
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/reports")}>
              <FileBarChart className="w-3.5 h-3.5" /> Reports
            </Button>
          </div>
        </div>

        {isLoading || !summary ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Members</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Active Members" value={summary.members.active} icon={Users} sub={`${summary.members.internal} internal · ${summary.members.external} external`} />
                <StatCard label="Pending Requests" value={summary.members.pending} icon={Clock} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Events</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Published" value={summary.events.published} icon={CalendarDays} sub={`${summary.events.upcoming} upcoming`} />
                <StatCard label="Draft" value={summary.events.draft} icon={CalendarDays} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Giving</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Donations Recorded"
                  value={`₹${summary.donations.total_recorded.toLocaleString("en-IN")}`}
                  icon={Gift}
                  sub={`${summary.donations.count} donations · ₹${summary.donations.total_pending.toLocaleString("en-IN")} pending`}
                />
                <StatCard
                  label="Sponsorships Recorded"
                  value={`₹${summary.sponsorships.total_recorded.toLocaleString("en-IN")}`}
                  icon={HeartHandshake}
                  sub={`${summary.sponsorships.count} pledges`}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Volunteering</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Roles Open" value={summary.volunteers.roles_open} icon={HandHeart} sub={`${summary.volunteers.roles_filled} filled`} />
                <StatCard label="Approvals Pending" value={summary.volunteers.assignments_pending} icon={Clock} sub={`${summary.volunteers.assignments_approved} approved`} />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
