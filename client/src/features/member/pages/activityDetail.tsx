import { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusChip from "@/components/reusable ui/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressMeter from "@/components/reusable ui/ProgressMeter";
import {
  CalendarDays,
  MapPin,
  Plus,
  Send,
  Ban,
  Users,
  CheckCircle2,
  CalendarCheck,
  HeartHandshake,
  Gift,
  Receipt,
  HandHeart,
  Check,
  X,
  MessagesSquare,
} from "lucide-react";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import BeneficiaryPicker from "../components/BeneficiaryPicker";
import { BeneficiaryInput } from "../api/participations";
import {
  useEvent,
  useEventSchedule,
  usePublishEvent,
  useCancelEvent,
  useCreateEventDay,
  useCreateEventComponent,
} from "../hooks/useEvents";
import { useMyParticipations, useCreateParticipation, useCancelParticipation, useComponentAvailability } from "../hooks/useParticipations";
import {
  useSponsorshipNeeds,
  useCreateSponsorshipNeed,
  useCreateSponsorship,
  useCreateDonation,
  useEventDonations,
  useEventSponsorships,
  useRecordDonationPayment,
  useRecordSponsorshipPayment,
} from "../hooks/useDonations";
import {
  useEventVolunteerRoles,
  useCreateVolunteerRole,
  useCreateVolunteerAssignment,
  useMyVolunteerAssignments,
  useCancelVolunteerAssignment,
  useRoleAssignments,
  useApproveVolunteerAssignment,
  useRejectVolunteerAssignment,
} from "../hooks/useVolunteers";
import { useEventChat } from "../hooks/useChat";
import EventDiscussionBoard from "../components/EventDiscussionBoard";
import { EventComponent, EventAudience, DayRegistrationMode } from "../api/events";
import { Participation } from "../api/participations";
import { SponsorshipNeed } from "../api/donations";
import { VolunteerRole } from "../api/volunteers";

const INHERIT_AUDIENCE = "inherit" as const;

const DAY_AUDIENCE_OPTIONS: { value: EventAudience | typeof INHERIT_AUDIENCE; label: string }[] = [
  { value: INHERIT_AUDIENCE, label: "Same as event" },
  { value: "internal", label: "Residents Only" },
  { value: "internal_external", label: "Residents + Guests" },
  { value: "public", label: "Public" },
  { value: "invite_only", label: "Invite Only" },
];

/** What every activity added under a day is allowed to offer. This is a
 * hard constraint enforced server-side (see event-components.service.ts) —
 * this dropdown, and the Add Activity dialog only rendering the allowed
 * checkbox(es), are just the UI reflecting that same rule up front. */
const DAY_REGISTRATION_MODE_OPTIONS: { value: DayRegistrationMode; label: string; description: string }[] = [
  { value: "join", label: "Join only", description: "Every activity this day can only offer one-tap Join." },
  {
    value: "participate",
    label: "Participate only",
    description: "Every activity this day can only offer detailed Participate registration.",
  },
  { value: "both", label: "Join or Participate", description: "Each activity can offer either or both, individually." },
];

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin, activeMembership } = useOrganizationContext();
  const canManage = isSuperAdmin || activeMembership?.role === "core_committee";

  const { data: event, isLoading } = useEvent(id);
  const { data: schedule } = useEventSchedule(id);
  const publishMutation = usePublishEvent(id!);
  const cancelMutation = useCancelEvent(id!);
  const createDay = useCreateEventDay(id!);
  const createComponent = useCreateEventComponent(id!);

  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayForm, setDayForm] = useState<{
    title: string;
    date: string;
    audience: EventAudience | typeof INHERIT_AUDIENCE;
    registration_mode: DayRegistrationMode;
  }>({
    title: "",
    date: "",
    audience: INHERIT_AUDIENCE,
    registration_mode: "both",
  });

  const [componentDialogFor, setComponentDialogFor] = useState<string | null>(null);
  const [componentDialogMode, setComponentDialogMode] = useState<DayRegistrationMode>("both");
  const [componentForm, setComponentForm] = useState({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    registration_enabled: true,
    participation_enabled: false,
  });

  const { data: myParticipations } = useMyParticipations();
  const createParticipation = useCreateParticipation(id);
  const cancelParticipation = useCancelParticipation();

  const myEventJoin = myParticipations?.find(
    (p) => p.event_id === id && !p.event_component_id && p.type === "join" && p.status === "active"
  );

  const { data: sponsorshipNeeds } = useSponsorshipNeeds(id);
  const createSponsorshipNeed = useCreateSponsorshipNeed(id!);
  const createSponsorship = useCreateSponsorship(id!);
  const createDonation = useCreateDonation();
  const { data: eventDonations } = useEventDonations(canManage ? id : undefined);
  const { data: eventSponsorships } = useEventSponsorships(canManage ? id : undefined);
  const recordDonationPayment = useRecordDonationPayment();
  const recordSponsorshipPayment = useRecordSponsorshipPayment(id!);

  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");

  const [sponsorNeed, setSponsorNeed] = useState<SponsorshipNeed | null>(null);
  const [sponsorAmount, setSponsorAmount] = useState("");

  const [needDialogOpen, setNeedDialogOpen] = useState(false);
  const [needForm, setNeedForm] = useState({ title: "", description: "", target_amount: "" });

  const { data: volunteerRoles } = useEventVolunteerRoles(id);
  const createVolunteerRole = useCreateVolunteerRole(id!);
  const { data: myVolunteerAssignments } = useMyVolunteerAssignments();
  const myAssignmentsForEvent = myVolunteerAssignments?.filter((a) => a.event_id === id);

  const [roleDialogOpen, setRoleDialogOpen] = useState<"volunteer" | "book" | false>(false);
  const [roleForm, setRoleForm] = useState({ title: "", description: "", slot_start: "", slot_end: "", headcount_needed: "" });

  const [manageRoleId, setManageRoleId] = useState<string | null>(null);


  const [chatOpen, setChatOpen] = useState(false);
  const { messages: chatMessages, connected: chatConnected, sendMessage: sendChatMessage } = useEventChat(chatOpen ? id : undefined);
  const [chatInput, setChatInput] = useState("");

  if (isLoading || !event) {
    return (
      <Layout title="Loading...">
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </Layout>
    );
  }

  const nextDayNumber = (schedule?.length || 0) + 1;

  return (
    <Layout title={event.name} subtitle={event.venue || undefined}>
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{event.name}</h2>
                  <StatusChip status={event.status} />
                </div>
                {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {event.start_date}
                {event.is_multi_day ? ` → ${event.end_date}` : ""}
                {event.timezone && <span className="text-xs text-muted-foreground">({event.timezone})</span>}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {event.venue}
                </span>
              )}
              {event.capacity && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> Capacity {event.capacity}
                </span>
              )}
            </div>

            {canManage && (
              <div className="flex gap-2 pt-2 border-t border-border">
                {event.status === "draft" && (
                  <Button size="sm" shape="pill" className="gap-1" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
                    <Send className="w-3.5 h-3.5" /> Publish
                  </Button>
                )}
                {event.status !== "cancelled" && event.status !== "completed" && (
                  <Button
                    size="sm"
                    shape="pill"
                    variant="outline"
                    className="gap-1 text-destructive"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </Button>
                )}
              </div>
            )}

            {event.status === "published" && event.registration_required && (
              <div className="pt-2 border-t border-border">
                {myEventJoin ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-success font-medium">
                      <CheckCircle2 className="w-4 h-4" /> You're registered
                    </span>
                    <Button
                      size="sm"
                      shape="pill"
                      variant="outline"
                      disabled={cancelParticipation.isPending}
                      onClick={() => cancelParticipation.mutate(myEventJoin.id)}
                    >
                      Cancel my spot
                    </Button>
                  </div>
                ) : (
                  <Button
                    shape="pill"
                    className="gap-1.5"
                    disabled={createParticipation.isPending}
                    onClick={() => createParticipation.mutate({ event_id: event.id, type: "join" })}
                  >
                    <CalendarCheck className="w-4 h-4" /> Join This Event
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Schedule</h3>
            {canManage && event.is_multi_day && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setDayDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Day
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {(schedule || []).map((day) => (
              <Card key={day.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        Day {day.day_number} · {day.title}
                        {day.audience && (
                          <Badge variant="outline" className="capitalize">
                            {DAY_AUDIENCE_OPTIONS.find((a) => a.value === day.audience)?.label ?? day.audience}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{day.date}</p>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => {
                          setComponentDialogMode(day.registration_mode);
                          setComponentForm({
                            name: "",
                            description: "",
                            start_time: "",
                            end_time: "",
                            registration_enabled: day.registration_mode !== "participate",
                            participation_enabled: day.registration_mode === "participate",
                          });
                          setComponentDialogFor(day.id);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Activity
                      </Button>
                    )}
                  </div>

                  {(day.components || []).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      {day.components!.map((c) => (
                        <ComponentRow key={c.id} component={c} myParticipations={myParticipations} eventId={id!} timezone={event?.timezone} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {event.volunteer_enabled && event.status === "published" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                  <HandHeart className="w-4 h-4" /> Volunteer / Seva
                </h3>
                {canManage && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setRoleDialogOpen("volunteer")}>
                    <Plus className="w-3.5 h-3.5" /> Add Role
                  </Button>
                )}
              </div>
              {(volunteerRoles || []).filter((r) => r.kind !== "book").length === 0 && (
                <p className="text-sm text-muted-foreground">No volunteer opportunities yet.</p>
              )}
              <div className="space-y-3">
                {(volunteerRoles || [])
                  .filter((r) => r.kind !== "book")
                  .map((role) => (
                    <VolunteerRoleRow
                      key={role.id}
                      role={role}
                      eventId={id!}
                      canManage={canManage}
                      myAssignment={myAssignmentsForEvent?.find((a) => a.volunteer_role_id === role.id && a.participation_status === "active" && a.approval_status !== "rejected" && a.approval_status !== "withdrawn")}
                      onManage={() => setManageRoleId(role.id)}
                    />
                  ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4" /> Book
                </h3>
                {canManage && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setRoleDialogOpen("book")}>
                    <Plus className="w-3.5 h-3.5" /> Add Booking Slot
                  </Button>
                )}
              </div>
              {(volunteerRoles || []).filter((r) => r.kind === "book").length === 0 && (
                <p className="text-sm text-muted-foreground">No booking slots yet.</p>
              )}
              <div className="space-y-3">
                {(volunteerRoles || [])
                  .filter((r) => r.kind === "book")
                  .map((role) => (
                    <VolunteerRoleRow
                      key={role.id}
                      role={role}
                      eventId={id!}
                      canManage={canManage}
                      myAssignment={myAssignmentsForEvent?.find((a) => a.volunteer_role_id === role.id && a.participation_status === "active" && a.approval_status !== "rejected" && a.approval_status !== "withdrawn")}
                      onManage={() => setManageRoleId(role.id)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {(event.donation_enabled || event.sponsorship_enabled) && event.status === "published" && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Support This Event</h3>
            <div className="space-y-4">
              {event.donation_enabled && (
                <Card>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-foreground">Make a general donation to this event</span>
                    </div>
                    <Button size="sm" shape="pill" className="gap-1.5 shrink-0" onClick={() => setDonateDialogOpen(true)}>
                      <Gift className="w-3.5 h-3.5" /> Donate
                    </Button>
                  </CardContent>
                </Card>
              )}

              {event.sponsorship_enabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4" /> Sponsorship Opportunities
                    </p>
                    {canManage && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setNeedDialogOpen(true)}>
                        <Plus className="w-3.5 h-3.5" /> Add Need
                      </Button>
                    )}
                  </div>
                  {(sponsorshipNeeds || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No sponsorship opportunities yet.</p>
                  )}
                  {(sponsorshipNeeds || []).map((need) => (
                    <Card key={need.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{need.title}</p>
                            {need.description && <p className="text-xs text-muted-foreground mt-0.5">{need.description}</p>}
                          </div>
                          <StatusChip status={need.status} />
                        </div>
                        <ProgressMeter raised={Number(need.amount_raised)} target={Number(need.target_amount)} />
                        {need.status === "open" && (
                          <Button size="sm" shape="pill" className="gap-1.5" onClick={() => setSponsorNeed(need)}>
                            <HeartHandshake className="w-3.5 h-3.5" /> Sponsor
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {canManage && (event.donation_enabled || event.sponsorship_enabled) && (
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> Payments
            </h3>
            <div className="space-y-2">
              {(eventDonations || []).map((d) => (
                <PaymentRow
                  key={d.id}
                  label={`Donation · ₹${Number(d.amount).toLocaleString("en-IN")}`}
                  status={d.payment_status}
                  receipt={d.receipt_number}
                  onRecord={(status) => recordDonationPayment.mutate({ id: d.id, data: { payment_status: status } })}
                  pending={recordDonationPayment.isPending}
                />
              ))}
              {(eventSponsorships || []).map((s) => (
                <PaymentRow
                  key={s.id}
                  label={`Sponsorship pledge · ₹${Number(s.amount_pledged).toLocaleString("en-IN")}`}
                  status={s.payment_status}
                  receipt={s.receipt_number}
                  onRecord={(status) => recordSponsorshipPayment.mutate({ id: s.id, data: { payment_status: status } })}
                  pending={recordSponsorshipPayment.isPending}
                />
              ))}
              {(eventDonations || []).length === 0 && (eventSponsorships || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No donations or pledges yet.</p>
              )}
            </div>
          </div>
        )}

        <EventDiscussionBoard
          eventId={event.id}
          canManage={canManage}
          myMembershipId={activeMembership?.id}
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <MessagesSquare className="w-4 h-4" /> Live Chat
            </h3>
            <Button size="sm" variant="outline" onClick={() => setChatOpen((v) => !v)}>
              {chatOpen ? "Close" : "Open"} Chat
            </Button>
          </div>
          {chatOpen && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`w-1.5 h-1.5 rounded-full ${chatConnected ? "bg-success" : "bg-muted-foreground"}`} />
                  {chatConnected ? "Connected" : "Connecting..."}
                </div>
                <div className="h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
                  {chatMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>}
                  {chatMessages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="font-medium text-foreground">{m.sender_name || "Member"}: </span>
                      <span className="text-muted-foreground">{m.body}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatInput.trim()) {
                        sendChatMessage(chatInput.trim());
                        setChatInput("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={!chatInput.trim()}
                    onClick={() => {
                      sendChatMessage(chatInput.trim());
                      setChatInput("");
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Donate to {event.name}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Amount (₹)</label>
            <Input
              type="number"
              min="1"
              value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value)}
              placeholder="e.g. 501"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!donateAmount || Number(donateAmount) <= 0 || createDonation.isPending}
              onClick={() =>
                createDonation.mutate(
                  { event_id: event.id, amount: Number(donateAmount) },
                  {
                    onSuccess: () => {
                      setDonateDialogOpen(false);
                      setDonateAmount("");
                    },
                  }
                )
              }
            >
              Submit Donation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sponsorNeed} onOpenChange={(open) => !open && setSponsorNeed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sponsor {sponsorNeed?.title}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Pledge Amount (₹)</label>
            <Input
              type="number"
              min="1"
              value={sponsorAmount}
              onChange={(e) => setSponsorAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!sponsorAmount || Number(sponsorAmount) <= 0 || createSponsorship.isPending}
              onClick={() =>
                sponsorNeed &&
                createSponsorship.mutate(
                  { sponsorship_need_id: sponsorNeed.id, amount_pledged: Number(sponsorAmount) },
                  {
                    onSuccess: () => {
                      setSponsorNeed(null);
                      setSponsorAmount("");
                    },
                  }
                )
              }
            >
              Submit Pledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={needDialogOpen} onOpenChange={setNeedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sponsorship Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <Input
                value={needForm.title}
                onChange={(e) => setNeedForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Stage Sound System"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <Input
                value={needForm.description}
                onChange={(e) => setNeedForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target Amount (₹)</label>
              <Input
                type="number"
                min="1"
                value={needForm.target_amount}
                onChange={(e) => setNeedForm((f) => ({ ...f, target_amount: e.target.value }))}
                placeholder="e.g. 25000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!needForm.title || !needForm.target_amount || createSponsorshipNeed.isPending}
              onClick={() =>
                createSponsorshipNeed.mutate(
                  {
                    event_id: event.id,
                    title: needForm.title,
                    description: needForm.description || undefined,
                    target_amount: Number(needForm.target_amount),
                  },
                  {
                    onSuccess: () => {
                      setNeedDialogOpen(false);
                      setNeedForm({ title: "", description: "", target_amount: "" });
                    },
                  }
                )
              }
            >
              Create Opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleDialogOpen} onOpenChange={(open) => !open && setRoleDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{roleDialogOpen === "book" ? "Add Booking Slot" : "Add Volunteer Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <Input
                value={roleForm.title}
                onChange={(e) => setRoleForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Registration Desk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Slot Start</label>
                <Input
                  type="time"
                  value={roleForm.slot_start}
                  onChange={(e) => setRoleForm((f) => ({ ...f, slot_start: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Slot End</label>
                <Input
                  type="time"
                  value={roleForm.slot_end}
                  onChange={(e) => setRoleForm((f) => ({ ...f, slot_end: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Volunteers Needed</label>
              <Input
                type="number"
                min="1"
                value={roleForm.headcount_needed}
                onChange={(e) => setRoleForm((f) => ({ ...f, headcount_needed: e.target.value }))}
                placeholder="e.g. 5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!roleForm.title || !roleForm.headcount_needed || createVolunteerRole.isPending}
              onClick={() =>
                createVolunteerRole.mutate(
                  {
                    event_id: event.id,
                    title: roleForm.title,
                    description: roleForm.description || undefined,
                    slot_start: roleForm.slot_start || undefined,
                    slot_end: roleForm.slot_end || undefined,
                    headcount_needed: Number(roleForm.headcount_needed),
                    kind: roleDialogOpen === "book" ? "book" : "volunteer",
                  },
                  {
                    onSuccess: () => {
                      setRoleDialogOpen(false);
                      setRoleForm({ title: "", description: "", slot_start: "", slot_end: "", headcount_needed: "" });
                    },
                  }
                )
              }
            >
              {roleDialogOpen === "book" ? "Create Booking Slot" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageRoleId} onOpenChange={(open) => !open && setManageRoleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign-ups</DialogTitle>
          </DialogHeader>
          {manageRoleId && <ManageRoleAssignments roleId={manageRoleId} eventId={id!} />}
        </DialogContent>
      </Dialog>

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Day {nextDayNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <Input
                value={dayForm.title}
                onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Visarjan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date</label>
              <Input
                type="date"
                value={dayForm.date}
                onChange={(e) => setDayForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Who can participate this day?</label>
              <Select
                value={dayForm.audience}
                onValueChange={(v) => setDayForm((f) => ({ ...f, audience: v as EventAudience | typeof INHERIT_AUDIENCE }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_AUDIENCE_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Only set this if this day should be more or less open than the rest of the event — e.g. a
                residents-only day within an otherwise public festival.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Registration for activities on this day
              </label>
              <Select
                value={dayForm.registration_mode}
                onValueChange={(v) => setDayForm((f) => ({ ...f, registration_mode: v as DayRegistrationMode }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_REGISTRATION_MODE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {DAY_REGISTRATION_MODE_OPTIONS.find((m) => m.value === dayForm.registration_mode)?.description}
                {" "}This is enforced for every activity you add under this day — not just a suggestion.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!dayForm.title || !dayForm.date || createDay.isPending}
              onClick={() =>
                createDay.mutate(
                  {
                    day_number: nextDayNumber,
                    date: dayForm.date,
                    title: dayForm.title,
                    audience: dayForm.audience === INHERIT_AUDIENCE ? undefined : dayForm.audience,
                    registration_mode: dayForm.registration_mode,
                  },
                  {
                    onSuccess: () => {
                      setDayDialogOpen(false);
                      setDayForm({
                        title: "",
                        date: "",
                        audience: INHERIT_AUDIENCE,
                        registration_mode: "both",
                      });
                    },
                  }
                )
              }
            >
              Add Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!componentDialogFor} onOpenChange={(open) => !open && setComponentDialogFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Activity name
              </label>
              <Input
                value={componentForm.name}
                onChange={(e) =>
                  setComponentForm((form) => ({
                    ...form,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g. Puja"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <Textarea
                value={componentForm.description}
                onChange={(e) =>
                  setComponentForm((form) => ({
                    ...form,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional details for members"
                rows={3}
                maxLength={2000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Starts
                  </label>
                  <Input
                    type="time"
                    value={componentForm.start_time}
                    onChange={(e) =>
                      setComponentForm((form) => ({
                        ...form,
                        start_time: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Ends
                  </label>
                  <Input
                    type="time"
                    value={componentForm.end_time}
                    min={componentForm.start_time || undefined}
                    onChange={(e) =>
                      setComponentForm((form) => ({
                        ...form,
                        end_time: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-1.5">
                Shown in the event timezone to members.
              </p>

              {componentForm.start_time &&
                componentForm.end_time &&
                componentForm.end_time <= componentForm.start_time && (
                  <p className="text-xs text-destructive mt-1.5">
                    End time must be later than start time.
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                How can members register?
              </label>

              {componentDialogMode !== "both" && (
                <p className="text-xs text-muted-foreground mb-2">
                  This day is set to "{DAY_REGISTRATION_MODE_OPTIONS.find((m) => m.value === componentDialogMode)?.label}" — only that option is available here. Change it from the day's settings if you need a mix.
                </p>
              )}

              <div className="space-y-2">
                {componentDialogMode !== "participate" && (
                  <label className="flex items-start gap-2 text-sm rounded-lg border border-border p-2.5">
                    <Checkbox
                      checked={componentForm.registration_enabled}
                      onCheckedChange={(checked) =>
                        setComponentForm((form) => ({
                          ...form,
                          registration_enabled: checked === true,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium text-foreground block">
                        Join
                      </span>
                      <span className="text-xs text-muted-foreground">
                        One-tap RSVP for the member themself.
                      </span>
                    </span>
                  </label>
                )}

                {componentDialogMode !== "join" && (
                  <label className="flex items-start gap-2 text-sm rounded-lg border border-border p-2.5">
                    <Checkbox
                      checked={componentForm.participation_enabled}
                      onCheckedChange={(checked) =>
                        setComponentForm((form) => ({
                          ...form,
                          participation_enabled: checked === true,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium text-foreground block">
                        Participate
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Detailed registration — single or multiple people, self / family / others.
                      </span>
                    </span>
                  </label>
                )}
              </div>

              {!componentForm.registration_enabled &&
                !componentForm.participation_enabled && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Neither is selected — members won't see a registration button for this activity.
                  </p>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setComponentDialogFor(null)}
            >
              Cancel
            </Button>

            <Button
              disabled={
                !componentForm.name.trim() ||
                createComponent.isPending ||
                (componentForm.start_time !== "" &&
                  componentForm.end_time !== "" &&
                  componentForm.end_time <= componentForm.start_time)
              }
              onClick={() => {
                if (!componentDialogFor) return;

                const name = componentForm.name.trim();
                const description = componentForm.description.trim();
                const startTime = componentForm.start_time.trim();
                const endTime = componentForm.end_time.trim();

                if (!name) return;

                if (
                  startTime &&
                  endTime &&
                  endTime <= startTime
                ) {
                  return;
                }

                createComponent.mutate(
                  {
                    dayId: componentDialogFor,
                    data: {
                      name,
                      description: description || undefined,
                      start_time: startTime || undefined,
                      end_time: endTime || undefined,
                      registration_enabled: componentForm.registration_enabled,
                      participation_enabled: componentForm.participation_enabled,
                    },
                  },
                  {
                    onSuccess: () => {
                      setComponentDialogFor(null);
                      setComponentForm({
                        name: "",
                        description: "",
                        start_time: "",
                        end_time: "",
                        registration_enabled: true,
                        participation_enabled: false,
                      });
                    },
                  },
                );
              }}
            >
              {createComponent.isPending ? "Adding..." : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function ComponentRow({
  component,
  myParticipations,
  eventId,
  timezone,
}: {
  component: EventComponent;
  myParticipations: Participation[] | undefined;
  eventId: string;
  timezone?: string;
}) {
  const { user } = useAuth();
  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";

  const createParticipation = useCreateParticipation(eventId);
  const cancelParticipation = useCancelParticipation();
  const { data: availability } = useComponentAvailability(
    component.requires_booking || component.capacity ? component.id : undefined
  );

  // 'entry' distinguishes which button opened the dialog — Join skips the
  // beneficiary picker entirely (it's the quick one-tap path), Participate
  // and Book both go through it.
  const [detailDialog, setDetailDialog] = useState<{ entry: "participate" | "book" } | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryInput[]>([{ relation_type: "self" }]);
  const [mode, setMode] = useState<"single" | "multiple">("single");

  const registrationType: "join" | "book" = component.requires_booking ? "book" : "join";
  const mine = myParticipations?.find(
    (p) => p.event_component_id === component.id && p.type === registrationType && p.status === "active"
  );
  const isFull = availability?.available === 0;

  const openDetailDialog = (entry: "participate" | "book") => {
    setBeneficiaries([{ relation_type: "self" }]);
    setMode("single");
    setDetailDialog({ entry });
  };

  const submitDetailDialog = () => {
    if (!detailDialog) return;
    createParticipation.mutate(
      {
        event_id: eventId,
        event_component_id: component.id,
        type: detailDialog.entry === "book" ? "book" : "join",
        mode,
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : undefined,
      },
      { onSuccess: () => setDetailDialog(null) }
    );
  };

  const beneficiaryCountValid = beneficiaries.length > 0 && (mode === "single" ? beneficiaries.length === 1 : true);
  const overCapacity = availability?.available != null && beneficiaries.length > availability.available;

  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <div className="min-w-0">
        <span className="text-foreground font-medium">{component.name}</span>
        {component.start_time && (
          <span className="text-muted-foreground ml-2">
            {component.start_time}
            {component.end_time ? `–${component.end_time}` : ""}
            {timezone && <span className="text-xs text-muted-foreground ml-1">({timezone})</span>}
          </span>
        )}
        {availability?.capacity != null && (
          <span className="text-xs text-muted-foreground block">
            {availability.available} of {availability.capacity} spots left
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="capitalize">
          {component.component_type.replace("_", " ")}
        </Badge>

        {mine ? (
          <Button size="sm" shape="pill" variant="outline" disabled={cancelParticipation.isPending} onClick={() => cancelParticipation.mutate(mine.id)}>
            Cancel
          </Button>
        ) : registrationType === "book" ? (
          <Button size="sm" shape="pill" disabled={isFull} onClick={() => openDetailDialog("book")}>
            {isFull ? "Full" : "Book"}
          </Button>
        ) : (
          <>
            {component.registration_enabled && (
              <Button
                size="sm"
                shape="pill"
                variant={component.participation_enabled ? "outline" : "default"}
                disabled={createParticipation.isPending || isFull}
                onClick={() => createParticipation.mutate({ event_id: eventId, event_component_id: component.id, type: "join" })}
              >
                {isFull ? "Full" : "Join"}
              </Button>
            )}
            {component.participation_enabled && (
              <Button size="sm" shape="pill" disabled={isFull} onClick={() => openDetailDialog("participate")}>
                {isFull ? "Full" : "Participate"}
              </Button>
            )}
          </>
        )}
      </div>

      <Dialog open={!!detailDialog} onOpenChange={(open) => !open && setDetailDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {detailDialog?.entry === "book" ? "Book" : "Participate in"} "{component.name}"
            </DialogTitle>
          </DialogHeader>
          <BeneficiaryPicker
            selfName={selfName}
            maxBeneficiaries={availability?.available ?? undefined}
            onChange={(next, nextMode) => {
              setBeneficiaries(next);
              setMode(nextMode);
            }}
          />
          {overCapacity && (
            <p className="text-xs text-destructive">
              Only {availability?.available} spot{availability?.available === 1 ? "" : "s"} left — remove a person to continue.
            </p>
          )}
          <DialogFooter>
            <Button
              disabled={createParticipation.isPending || !beneficiaryCountValid || overCapacity}
              onClick={submitDetailDialog}
            >
              {detailDialog?.entry === "book" ? "Confirm Booking" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentRow({
  label,
  status,
  receipt,
  onRecord,
  pending,
}: {
  label: string;
  status: "pending" | "recorded" | "failed";
  receipt?: string;
  onRecord: (status: "recorded" | "failed") => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <span className="text-foreground">{label}</span>
          {receipt && <span className="text-xs text-muted-foreground block">Receipt {receipt}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusChip status={status} />
          {status === "pending" && (
            <>
              <Button size="sm" shape="pill" variant="outline" disabled={pending} onClick={() => onRecord("failed")}>
                Mark Failed
              </Button>
              <Button size="sm" shape="pill" disabled={pending} onClick={() => onRecord("recorded")}>
                Mark Paid
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VolunteerRoleRow({
  role,
  eventId,
  canManage,
  myAssignment,
  onManage,
}: {
  role: VolunteerRole;
  eventId: string;
  canManage: boolean;
  myAssignment?: { id: string; approval_status: string };
  onManage: () => void;
}) {
  const createAssignment = useCreateVolunteerAssignment(eventId);
  const cancelAssignment = useCancelVolunteerAssignment(eventId);
  const spotsLeft = Math.max(0, role.headcount_needed - role.headcount_filled);

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground">{role.title}</p>
            {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
            {role.slot_start && (
              <p className="text-xs text-muted-foreground">
                {role.slot_start}
                {role.slot_end ? `–${role.slot_end}` : ""}
              </p>
            )}
          </div>
          <StatusChip status={role.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {role.headcount_filled} of {role.headcount_needed} filled · {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
        </p>
        <div className="flex items-center gap-2">
          {myAssignment ? (
            <>
              <StatusChip status={myAssignment.approval_status} />
              <Button
                size="sm"
                shape="pill"
                variant="outline"
                disabled={cancelAssignment.isPending}
                onClick={() => cancelAssignment.mutate(myAssignment.id)}
              >
                Withdraw
              </Button>
            </>
          ) : (
            role.status === "open" && (
              <Button
                size="sm"
                shape="pill"
                className="gap-1.5"
                disabled={createAssignment.isPending}
                onClick={() => createAssignment.mutate(role.id)}
              >
                <HandHeart className="w-3.5 h-3.5" /> {role.kind === "book" ? "Book" : "Sign Up"}
              </Button>
            )
          )}
          {canManage && (
            <Button size="sm" shape="pill" variant="ghost" onClick={onManage}>
              Manage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ManageRoleAssignments({ roleId, eventId }: { roleId: string; eventId: string }) {
  const { data: assignments, isLoading } = useRoleAssignments(roleId);
  const approve = useApproveVolunteerAssignment(roleId);
  const reject = useRejectVolunteerAssignment(roleId, eventId);

  if (isLoading) {
    return <Skeleton className="h-24 rounded-xl" />;
  }
  if (!assignments || assignments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No sign-ups yet.</p>;
  }

  return (
    <div className="space-y-2">
      {assignments.map((a) => (
        <div key={a.id} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{a.member_name || "Member"}</p>
              {a.member_email && (
                <p className="text-xs text-muted-foreground truncate">{a.member_email}</p>
              )}
            </div>
            <StatusChip status={a.approval_status} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {a.approval_status === "withdrawn" ? "Withdrawn" : a.approval_status === "rejected" ? "Rejected" : a.approval_status === "approved" ? "Approved" : "Awaiting approval"}
            </p>
            {a.approval_status === "pending" && (
            <div className="flex items-center gap-2">
              <Button size="sm" shape="pill" variant="outline" className="gap-1" disabled={reject.isPending} onClick={() => reject.mutate(a.id)}>
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
              <Button size="sm" shape="pill" className="gap-1" disabled={approve.isPending} onClick={() => approve.mutate(a.id)}>
                <Check className="w-3.5 h-3.5" /> Approve
              </Button>
            </div>
          )}
          </div>
        </div>
      ))}
    </div>
  );
}
