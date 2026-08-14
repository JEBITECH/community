import Layout from "@/components/Layout";
import { BarChart3 } from "lucide-react";
import StatsCards from "../components/StatsCards";
import QuickActions from "../components/QuickActions";
import SystemStatus from "../components/SystemStatus";
import RecentActivity from "../components/RecentActivity";

export default function Dashboard() {
  return (
    <Layout title="Dashboard" subtitle="Monitor organizations, users, and system status" icon={<BarChart3 className="h-8 w-8" />}>
      <div className="p-6 space-y-8 bg-background">

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>

          <div className="space-y-6">
            <SystemStatus />
          </div>
        </div>
      </div>
    </Layout>
  );
}
