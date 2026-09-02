import { Speaker } from "lucide-react";

import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizationContext } from "@/contexts/OrganizationContext";

import AnnouncementsPanel from "../components/AnnouncementsPanel";

export default function AnnouncementsPage() {
  const {
    activeMembership,
    isLoadingOrganizations,
  } = useOrganizationContext();

  if (isLoadingOrganizations && !activeMembership) {
    return (
      <Layout
        title="Announcements"
        subtitle="Community updates and important notices"
        icon={<Speaker className="w-5 h-5" />}
      >
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!activeMembership) {
    return (
      <Layout
        title="Announcements"
        subtitle="Community updates and important notices"
        icon={<Speaker className="w-5 h-5" />}
      >
        <div className="max-w-3xl mx-auto py-6 px-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Join a community to view its announcements.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Announcements"
      subtitle="Community updates and important notices"
      icon={<Speaker className="w-5 h-5" />}
    >
      <div className="max-w-3xl mx-auto py-6 px-4">
        <AnnouncementsPanel />
      </div>
    </Layout>
  );
}
