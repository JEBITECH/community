import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, Users, CalendarDays, Gift, Plus } from "lucide-react";
import { usePlatformSummary } from "../hooks/useDashboard";

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
  const { data: summary, isLoading } = usePlatformSummary();

  return (
    <Layout title="Platform Dashboard" subtitle="Across every community on the platform" icon={<ShieldCheck className="w-5 h-5" />}>
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
        <div className="flex justify-end">
          <Link to="/organizations/new">
            <Button shape="pill" className="gap-1">
              <Plus className="w-4 h-4" /> New Organization
            </Button>
          </Link>
        </div>
        {isLoading || !summary ? (
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
      </div>
    </Layout>
  );
}
