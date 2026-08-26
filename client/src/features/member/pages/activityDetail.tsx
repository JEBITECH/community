import { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusChip from "@/components/reusable ui/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MessageCircle,
  MessagesSquare,
  Flag,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
} from "lucide-react";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
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
import { useEventComments, useCreateComment, useUpdateComment, useDeleteComment, useReportComment, useModerateComment } from "../hooks/useComments";
import { useEventChat } from "../hooks/useChat";
import { EventComponent, EventAudience } from "../api/events";
import { Participation } from "../api/participations";
import { SponsorshipNeed } from "../api/donations";
import { VolunteerRole } from "../api/volunteers";
import { EventComment } from "../api/comments";

const INHERIT_AUDIENCE = "inherit" as const;

const DAY_AUDIENCE_OPTIONS: { value: EventAudience | typeof INHERIT_AUDIENCE; label: string }[] = [
  { value: INHERIT_AUDIENCE, label: "Same as event" },
  { value: "internal", label: "Residents Only" },
  { value: "internal_external", label: "Residents + Guests" },
  { value: "public", label: "Public" },
  { value: "invite_only", label: "Invite Only" },
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
  const [dayForm, setDayForm] = useState<{ title: string; date: string; audience: EventAudience | typeof INHERIT_AUDIENCE }>({
    title: "",
    date: "",
    audience: INHERIT_AUDIENCE,
  });

  const [componentDialogFor, setComponentDialogFor] = useState<string | null>(null);
  const [componentForm, setComponentForm] = useState({ name: "" });

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

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ title: "", description: "", slot_start: "", slot_end: "", headcount_needed: "" });

  const [manageRoleId, setManageRoleId] = useState<string | null>(null);

  const { data: comments } = useEventComments(id);
  const createComment = useCreateComment(id!);
  const updateComment = useUpdateComment(id!);
  const deleteComment = useDeleteComment(id!);
  const reportComment = useReportComment(id!);
  const moderateComment = useModerateComment(id!);
  const [newComment, setNewComment] = useState("");

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
                        onClick={() => setComponentDialogFor(day.id)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Activity
                      </Button>
                    )}
                  </div>

                  {(day.components || []).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      {day.components!.map((c) => (
                        <ComponentRow key={c.id} component={c} myParticipations={myParticipations} eventId={id!} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {event.volunteer_enabled && event.status === "published" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                <HandHeart className="w-4 h-4" /> Volunteer / Seva
              </h3>
              {canManage && (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setRoleDialogOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add Role
                </Button>
              )}
            </div>
            {(volunteerRoles || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No volunteer opportunities yet.</p>
            )}
            <div className="space-y-3">
              {(volunteerRoles || []).map((role) => (
                <VolunteerRoleRow
                  key={role.id}
                  role={role}
                  eventId={id!}
                  canManage={canManage}
                  myAssignment={myAssignmentsForEvent?.find((a) => a.volunteer_role_id === role.id && a.approval_status !== "rejected")}
                  onManage={() => setManageRoleId(role.id)}
                />
              ))}
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

        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" /> Discussion
          </h3>
          <div className="space-y-3 mb-3">
            <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ask a question or share something..." />
            <Button
              size="sm"
              shape="pill"
              disabled={!newComment.trim() || createComment.isPending}
              onClick={() =>
                createComment.mutate({ body: newComment.trim() }, { onSuccess: () => setNewComment("") })
              }
            >
              Post
            </Button>
          </div>
          <div className="space-y-3">
            {(comments || []).filter((c) => !c.parent_comment_id).length === 0 && (
              <p className="text-sm text-muted-foreground">No comments yet — be the first to say something.</p>
            )}
            {(comments || [])
              .filter((c) => !c.parent_comment_id)
              .map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  replies={(comments || []).filter((c) => c.parent_comment_id === comment.id)}
                  canManage={canManage}
                  myMembershipId={activeMembership?.id}
                  onUpdate={(commentId, body) => updateComment.mutate({ id: commentId, body })}
                  onDelete={(commentId) => deleteComment.mutate(commentId)}
                  onReport={(commentId) => reportComment.mutate(commentId)}
                  onModerate={(commentId, status) => moderateComment.mutate({ id: commentId, status })}
                  onReply={(body, parentId) => createComment.mutate({ body, parent_comment_id: parentId })}
                />
              ))}
          </div>
        </div>

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

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Volunteer Role</DialogTitle>
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
              Create Role
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
                  },
                  {
                    onSuccess: () => {
                      setDayDialogOpen(false);
                      setDayForm({ title: "", date: "", audience: INHERIT_AUDIENCE });
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <Input
              value={componentForm.name}
              onChange={(e) => setComponentForm({ name: e.target.value })}
              placeholder="e.g. Decoration Seva"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!componentForm.name || createComponent.isPending}
              onClick={() =>
                componentDialogFor &&
                createComponent.mutate(
                  { dayId: componentDialogFor, data: { name: componentForm.name } },
                  {
                    onSuccess: () => {
                      setComponentDialogFor(null);
                      setComponentForm({ name: "" });
                    },
                  }
                )
              }
            >
              Add Activity
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
}: {
  component: EventComponent;
  myParticipations: Participation[] | undefined;
  eventId: string;
}) {
  const createParticipation = useCreateParticipation(eventId);
  const cancelParticipation = useCancelParticipation();
  const { data: availability } = useComponentAvailability(
    component.requires_booking || component.capacity ? component.id : undefined
  );

  const type = component.requires_booking ? "book" : "join";
  const mine = myParticipations?.find(
    (p) => p.event_component_id === component.id && p.type === type && p.status === "active"
  );
  const canRegister = component.requires_booking ? component.requires_booking : component.registration_enabled;
  const isFull = availability?.available === 0;

  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <div className="min-w-0">
        <span className="text-foreground font-medium">{component.name}</span>
        {component.start_time && (
          <span className="text-muted-foreground ml-2">
            {component.start_time}
            {component.end_time ? `–${component.end_time}` : ""}
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
        {canRegister &&
          (mine ? (
            <Button size="sm" shape="pill" variant="outline" disabled={cancelParticipation.isPending} onClick={() => cancelParticipation.mutate(mine.id)}>
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              shape="pill"
              disabled={createParticipation.isPending || isFull}
              onClick={() => createParticipation.mutate({ event_id: eventId, event_component_id: component.id, type })}
            >
              {isFull ? "Full" : type === "book" ? "Book" : "Join"}
            </Button>
          ))}
      </div>
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
                <HandHeart className="w-3.5 h-3.5" /> Sign Up
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
        <div key={a.id} className="flex items-center justify-between text-sm gap-2 py-1">
          <StatusChip status={a.approval_status} />
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
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  canManage,
  myMembershipId,
  onUpdate,
  onDelete,
  onReport,
  onModerate,
  onReply,
  allowReply,
}: {
  comment: EventComment;
  canManage: boolean;
  myMembershipId?: string;
  onUpdate: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onModerate: (id: string, status: "visible" | "hidden") => void;
  onReply?: (body: string, parentId: string) => void;
  allowReply?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const isOwner = comment.membership_id === myMembershipId;
  const isHidden = comment.moderation_status === "hidden";

  return (
    <div className={`text-sm ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium text-foreground">{comment.author_name}</span>
          {comment.moderation_status === "reported" && canManage && (
            <Badge variant="outline" className="ml-2 text-xs text-destructive border-destructive/30">
              Reported
            </Badge>
          )}
          {isHidden && (
            <Badge variant="outline" className="ml-2 text-xs">
              Hidden
            </Badge>
          )}
        </div>
      </div>
      {editing ? (
        <div className="mt-1 space-y-2">
          <Input value={editBody} onChange={(e) => setEditBody(e.target.value)} />
          <div className="flex gap-2">
            <Button
              size="sm"
              shape="pill"
              onClick={() => {
                onUpdate(comment.id, editBody.trim());
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button size="sm" shape="pill" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-0.5">{comment.body}</p>
      )}
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        {allowReply && onReply && (
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setReplying((v) => !v)}>
            Reply
          </button>
        )}
        {isOwner && !editing && (
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setEditing(true)}>
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
        {(isOwner || canManage) && (
          <button className="flex items-center gap-1 hover:text-destructive" onClick={() => onDelete(comment.id)}>
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        )}
        {!isOwner && (
          <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onReport(comment.id)}>
            <Flag className="w-3 h-3" /> Report
          </button>
        )}
        {canManage && (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => onModerate(comment.id, isHidden ? "visible" : "hidden")}
          >
            {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {isHidden ? "Unhide" : "Hide"}
          </button>
        )}
      </div>
      {replying && onReply && (
        <div className="mt-2 flex gap-2">
          <Input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply..." />
          <Button
            size="sm"
            shape="pill"
            disabled={!replyBody.trim()}
            onClick={() => {
              onReply(replyBody.trim(), comment.id);
              setReplyBody("");
              setReplying(false);
            }}
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  replies,
  canManage,
  myMembershipId,
  onUpdate,
  onDelete,
  onReport,
  onModerate,
  onReply,
}: {
  comment: EventComment;
  replies: EventComment[];
  canManage: boolean;
  myMembershipId?: string;
  onUpdate: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onModerate: (id: string, status: "visible" | "hidden") => void;
  onReply: (body: string, parentId: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <CommentItem
          comment={comment}
          canManage={canManage}
          myMembershipId={myMembershipId}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReport={onReport}
          onModerate={onModerate}
          onReply={onReply}
          allowReply
        />
        {replies.length > 0 && (
          <div className="pl-4 border-l-2 border-border space-y-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                canManage={canManage}
                myMembershipId={myMembershipId}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onReport={onReport}
                onModerate={onModerate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
