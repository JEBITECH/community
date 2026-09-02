import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/reusable ui/StatusChip";
import { CalendarCheck, Ticket, QrCode, HeartHandshake, HandHeart, MessageCircle } from "lucide-react";
import { useMyParticipations, useCancelParticipation } from "../hooks/useParticipations";
import { useEvent } from "../hooks/useEvents";
import { useMyDonations, useMySponsorships } from "../hooks/useDonations";
import { useMyVolunteerAssignments, useCancelVolunteerAssignment } from "../hooks/useVolunteers";
import { useMyComments } from "../hooks/useComments";
import { Participation } from "../api/participations";

function ParticipationCard({ participation }: { participation: Participation }) {
  const navigate = useNavigate();
  const { data: event } = useEvent(participation.event_id);
  const cancelParticipation = useCancelParticipation();

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/events/${participation.event_id}`)}>
          <p className="font-medium text-foreground truncate">{event?.name || "Loading..."}</p>
          {event?.start_date && <p className="text-xs text-muted-foreground">{event.start_date}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusChip status={participation.status} />
          {participation.status === "active" && (
            <Button
              size="sm"
              shape="pill"
              variant="outline"
              disabled={cancelParticipation.isPending}
              onClick={() => cancelParticipation.mutate(participation.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ContributionRow({
  eventId,
  eventName,
  label,
  amount,
  status,
  receipt,
}: {
  eventId: string;
  eventName: string;
  label: string;
  amount: number;
  status: string;
  receipt?: string;
}) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3 cursor-pointer" onClick={() => navigate(`/events/${eventId}`)}>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{eventName}</p>
          <p className="text-xs text-muted-foreground">
            {label} · ₹{amount.toLocaleString("en-IN")}
            {receipt ? ` · Receipt ${receipt}` : ""}
          </p>
        </div>
        <StatusChip status={status} />
      </CardContent>
    </Card>
  );
}

function SevaCard({ assignment }: { assignment: { id: string; event_id: string; event_name: string; role_title: string; approval_status: string; participation_status?: string } }) {
  const navigate = useNavigate();
  const cancelAssignment = useCancelVolunteerAssignment();

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/events/${assignment.event_id}`)}>
          <p className="font-medium text-foreground truncate">{assignment.event_name}</p>
          <p className="text-xs text-muted-foreground">{assignment.role_title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusChip status={assignment.approval_status} />
          {assignment.participation_status === "active" && assignment.approval_status !== "rejected" && assignment.approval_status !== "withdrawn" && (
            <Button
              size="sm"
              shape="pill"
              variant="outline"
              disabled={cancelAssignment.isPending}
              onClick={() => cancelAssignment.mutate(assignment.id)}
            >
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MyCommentCard({ eventId, eventName, body, createdAt }: { eventId: string; eventName: string; body: string; createdAt: string }) {
  const navigate = useNavigate();
  return (
    <Card className="cursor-pointer" onClick={() => navigate(`/events/${eventId}`)}>
      <CardContent className="p-4">
        <p className="font-medium text-foreground truncate">{eventName}</p>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
        <p className="text-xs text-muted-foreground mt-1">{new Date(createdAt).toLocaleDateString("en-IN")}</p>
      </CardContent>
    </Card>
  );
}

export default function MyActivities() {
  const { data: joins, isLoading: loadingJoins } = useMyParticipations("join");
  const { data: bookings, isLoading: loadingBookings } = useMyParticipations("book");
  const { data: donations, isLoading: loadingDonations } = useMyDonations();
  const { data: sponsorships, isLoading: loadingSponsorships } = useMySponsorships();
  const { data: sevaAssignments, isLoading: loadingSeva } = useMyVolunteerAssignments();
  const { data: myComments, isLoading: loadingComments } = useMyComments();

  const renderList = (items: Participation[] | undefined, isLoading: boolean, emptyLabel: string) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      );
    }
    if (!items || items.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-10">{emptyLabel}</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((p) => (
          <ParticipationCard key={p.id} participation={p} />
        ))}
      </div>
    );
  };

  return (
    <Layout title="My Activities" subtitle="Everything you've joined, booked, or volunteered for" icon={<Ticket className="w-5 h-5" />}>
      <div className="max-w-3xl mx-auto py-6 px-4">
        <Tabs defaultValue="events">
          <TabsList className="flex w-full overflow-x-auto justify-start gap-1">
            <TabsTrigger value="events" className="gap-1.5 shrink-0">
              <CalendarCheck className="w-4 h-4" /> Events
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 shrink-0">
              <QrCode className="w-4 h-4" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="donations" className="gap-1.5 shrink-0">
              <HeartHandshake className="w-4 h-4" /> Giving
            </TabsTrigger>
            <TabsTrigger value="seva" className="gap-1.5 shrink-0">
              <HandHeart className="w-4 h-4" /> Seva
            </TabsTrigger>
            <TabsTrigger value="discussions" className="gap-1.5 shrink-0">
              <MessageCircle className="w-4 h-4" /> Discussions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="events" className="pt-4">
            {renderList(joins, loadingJoins, "You haven't joined any events yet.")}
          </TabsContent>
          <TabsContent value="bookings" className="pt-4">
            {renderList(bookings, loadingBookings, "No bookings yet.")}
          </TabsContent>
          <TabsContent value="donations" className="pt-4 space-y-4">
            {loadingDonations || loadingSponsorships ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (donations || []).length === 0 && (sponsorships || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No donations or sponsorships yet.</p>
            ) : (
              <div className="space-y-3">
                {(donations || []).map((d) => (
                  <ContributionRow
                    key={d.id}
                    eventId={d.event_id}
                    eventName={d.event_name}
                    label="Donation"
                    amount={Number(d.amount)}
                    status={d.payment_status}
                    receipt={d.receipt_number}
                  />
                ))}
                {(sponsorships || []).map((s) => (
                  <ContributionRow
                    key={s.id}
                    eventId={s.event_id}
                    eventName={s.event_name}
                    label="Sponsorship pledge"
                    amount={Number(s.amount_pledged)}
                    status={s.payment_status}
                    receipt={s.receipt_number}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="seva" className="pt-4">
            {loadingSeva ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !sevaAssignments || sevaAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No volunteer sign-ups yet.</p>
            ) : (
              <div className="space-y-3">
                {sevaAssignments.map((a) => (
                  <SevaCard key={a.id} assignment={a} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="discussions" className="pt-4">
            {loadingComments ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !myComments || myComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">You haven't posted any comments yet.</p>
            ) : (
              <div className="space-y-3">
                {myComments.map((c) => (
                  <MyCommentCard key={c.id} eventId={c.event_id} eventName={c.event_name} body={c.body} createdAt={c.createdAt} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
