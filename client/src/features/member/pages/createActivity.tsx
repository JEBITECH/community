import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import AppStepper from "@/components/reusable ui/AppStepper";
import OptionCard from "@/components/reusable ui/OptionCard";
import {
  PartyPopper,
  GraduationCap,
  Wrench,
  Trophy,
  Users,
  Sparkles,
  Briefcase,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCreateEvent } from "../hooks/useEvents";
import { EventAudience, EventType } from "../api/events";

const STEP_LABELS = ["Type", "Details", "Schedule", "Audience & Settings", "Review"];

const EVENT_TYPES: { value: EventType; label: string; icon: any }[] = [
  { value: "community_program", label: "Community Program", icon: Users },
  { value: "festival", label: "Festival", icon: PartyPopper },
  { value: "educational_program", label: "Educational Program", icon: GraduationCap },
  { value: "workshop", label: "Workshop", icon: Wrench },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "cultural", label: "Cultural", icon: Sparkles },
  { value: "meeting", label: "Meeting", icon: Briefcase },
  { value: "fundraising", label: "Fundraising", icon: HeartHandshake },
];

const AUDIENCE_OPTIONS: { value: EventAudience; label: string; description: string }[] = [
  { value: "internal", label: "Residents Only", description: "Only internal members can see and join" },
  { value: "internal_external", label: "Residents + Guests", description: "Internal members and their guests" },
  { value: "public", label: "Public", description: "Anyone can discover and join, no login required" },
  { value: "invite_only", label: "Invite Only", description: "Only people you invite can join" },
];

export default function CreateActivity() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const [step, setStep] = useState(1);

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [audience, setAudience] = useState<EventAudience>("internal");
  const [capacity, setCapacity] = useState("");
  const [registrationRequired, setRegistrationRequired] = useState(true);
  const [volunteerEnabled, setVolunteerEnabled] = useState(false);
  const [donationEnabled, setDonationEnabled] = useState(false);
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);

  const canProceed = () => {
    if (step === 1) return !!eventType;
    if (step === 2) return name.trim().length > 0;
    if (step === 3) return !!startDate && !!(isMultiDay ? endDate : true);
    return true;
  };

  const handlePublishOrDraft = (publish: boolean) => {
    if (!eventType || !startDate) return;
    createEvent.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        is_multi_day: isMultiDay,
        start_date: startDate,
        end_date: isMultiDay ? endDate : startDate,
        venue: venue.trim() || undefined,
        audience,
        capacity: capacity ? Number(capacity) : undefined,
        registration_required: registrationRequired,
        volunteer_enabled: volunteerEnabled,
        donation_enabled: donationEnabled,
        sponsorship_enabled: sponsorshipEnabled,
      },
      {
        onSuccess: (created) => {
          if (publish) {
            navigate(`/events/${created.id}`);
          } else {
            navigate(`/events/${created.id}`);
          }
        },
      }
    );
  };

  return (
    <Layout title="Create Activity" subtitle="Set up an event, festival, or program for your community">
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        <AppStepper stepData={STEP_LABELS} step={step} />

        <Card>
          <CardContent className="p-6 space-y-6">
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">What are you creating?</h3>
                <p className="text-sm text-muted-foreground mb-4">Choose the type that best fits your activity.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EVENT_TYPES.map((t) => (
                    <OptionCard
                      key={t.value}
                      icon={t.icon}
                      label={t.label}
                      selected={eventType === t.value}
                      onClick={() => setEventType(t.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Activity Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ganesh Chaturthi" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell members what this is about"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Venue</label>
                  <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Community Hall" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Multi-day event</p>
                    <p className="text-xs text-muted-foreground">Spans several days with its own schedule (e.g. a festival)</p>
                  </div>
                  <Switch checked={isMultiDay} onCheckedChange={setIsMultiDay} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {isMultiDay ? "Start Date" : "Date"}
                    </label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  {isMultiDay && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  )}
                </div>
                {isMultiDay && (
                  <p className="text-xs text-muted-foreground">
                    You'll add each day's schedule and activities after creating the festival shell.
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Who can participate?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AUDIENCE_OPTIONS.map((a) => (
                      <OptionCard
                        key={a.value}
                        label={a.label}
                        description={a.description}
                        selected={audience === a.value}
                        onClick={() => setAudience(a.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Capacity (optional)</label>
                  <Input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Require registration", value: registrationRequired, set: setRegistrationRequired },
                    { label: "Accept volunteers", value: volunteerEnabled, set: setVolunteerEnabled },
                    { label: "Accept donations", value: donationEnabled, set: setDonationEnabled },
                    { label: "Accept sponsorships", value: sponsorshipEnabled, set: setSponsorshipEnabled },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <p className="text-sm text-foreground">{row.label}</p>
                      <Switch checked={row.value} onCheckedChange={row.set as (v: boolean) => void} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Review</h3>
                <dl className="text-sm divide-y divide-border">
                  {[
                    ["Type", EVENT_TYPES.find((t) => t.value === eventType)?.label],
                    ["Name", name],
                    ["Venue", venue || "—"],
                    ["Dates", isMultiDay ? `${startDate} → ${endDate}` : startDate],
                    ["Audience", AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label],
                    ["Capacity", capacity || "Unlimited"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-foreground font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button shape="pill" variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < 5 ? (
            <Button shape="pill" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button shape="pill" variant="outline" disabled={createEvent.isPending} onClick={() => handlePublishOrDraft(false)}>
                Save as Draft
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
