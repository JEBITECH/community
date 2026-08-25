import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatusChip from "@/components/reusable ui/StatusChip";
import { Users, Phone, Mail, Check, X } from "lucide-react";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import { useDirectory, usePendingMembers, useApproveMember, useRejectMember } from "../hooks/useMembers";
import { DirectoryEntry } from "../api/members";

function MemberCard({ member, contact }: { member: DirectoryEntry; contact?: { phone?: string; email?: string | null } }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {member.first_name} {member.last_name || ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {member.unit_identifier ? `${member.unit_identifier} · ` : ""}
            {member.role.replace(/_/g, " ")}
          </p>
          {contact?.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" /> {contact.phone}
            </p>
          )}
          {contact?.email && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" /> {contact.email}
            </p>
          )}
        </div>
        <StatusChip status={member.member_type} />
      </CardContent>
    </Card>
  );
}

function PendingRow({ member }: { member: DirectoryEntry }) {
  const approve = useApproveMember();
  const reject = useRejectMember();
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {member.first_name} {member.last_name || ""}
          </p>
          {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" shape="pill" variant="outline" className="gap-1" disabled={reject.isPending} onClick={() => reject.mutate(member.membership_id)}>
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
          <Button size="sm" shape="pill" className="gap-1" disabled={approve.isPending} onClick={() => approve.mutate(member.membership_id)}>
            <Check className="w-3.5 h-3.5" /> Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Directory() {
  const { isSuperAdmin, activeMembership } = useOrganizationContext();
  const canManage = isSuperAdmin || activeMembership?.role === "core_committee";

  const { data: directory, isLoading } = useDirectory();
  const { data: pending, isLoading: loadingPending } = usePendingMembers(canManage);

  const list = (
    <div className="space-y-3">
      {isLoading ? (
        [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : !directory || directory.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No members visible in the directory yet.</p>
      ) : (
        directory.map((m) => <MemberCard key={m.membership_id} member={m} />)
      )}
    </div>
  );

  return (
    <Layout title="Directory" subtitle="Members of your community" icon={<Users className="w-5 h-5" />}>
      <div className="max-w-3xl mx-auto py-6 px-4">
        {canManage ? (
          <Tabs defaultValue="members">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="pending">
                Pending{pending && pending.length > 0 ? ` (${pending.length})` : ""}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="pt-4">
              {list}
            </TabsContent>
            <TabsContent value="pending" className="pt-4">
              {loadingPending ? (
                <Skeleton className="h-20 rounded-xl" />
              ) : !pending || pending.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((m) => (
                    <PendingRow key={m.membership_id} member={m} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          list
        )}
      </div>
    </Layout>
  );
}
