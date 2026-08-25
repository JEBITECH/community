import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressMeter from "@/components/reusable ui/ProgressMeter";
import StatusChip from "@/components/reusable ui/StatusChip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, MapPin, CalendarCheck, Gift, HeartHandshake } from "lucide-react";
import { getPublicEvent } from "@/features/member/api/events";
import { useGuestOrganization, useGuestSponsorshipNeeds } from "../hooks/useGuest";
import { useGuestParticipation, useGuestDonation, useGuestSponsorship } from "../hooks/useGuest";
import { GuestInfo } from "../api/guest";
import GuestShell from "../components/GuestShell";
import GuestInfoFields from "../components/GuestInfoFields";

const EMPTY_GUEST: GuestInfo = { first_name: "", last_name: "", phone: "", email: "" };

export default function GuestActivity() {
  const { subdomain, id } = useParams<{ subdomain: string; id: string }>();
  const navigate = useNavigate();
  const { data: organization } = useGuestOrganization(subdomain);
  const { data: event, isLoading } = useQuery({
    queryKey: ["guest-public-event", id],
    queryFn: () => getPublicEvent(id!),
    enabled: !!id,
  });
  const { data: sponsorshipNeeds } = useGuestSponsorshipNeeds(event?.sponsorship_enabled ? id : undefined);

  const joinMutation = useGuestParticipation();
  const donateMutation = useGuestDonation();
  const sponsorMutation = useGuestSponsorship(id);

  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinGuest, setJoinGuest] = useState<GuestInfo>(EMPTY_GUEST);

  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [donateGuest, setDonateGuest] = useState<GuestInfo>(EMPTY_GUEST);

  const [sponsorNeedId, setSponsorNeedId] = useState<string | null>(null);
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [sponsorGuest, setSponsorGuest] = useState<GuestInfo>(EMPTY_GUEST);

  const isGuestValid = (g: GuestInfo) => !!g.first_name && !!g.phone;

  if (isLoading || !event) {
    return (
      <GuestShell organization={organization}>
        <Skeleton className="h-40 rounded-xl" />
      </GuestShell>
    );
  }

  return (
    <GuestShell organization={organization}>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-foreground">{event.name}</h1>
            <StatusChip status={event.event_type} />
          </div>
          {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
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
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {event.registration_required && (
              <Button shape="pill" className="gap-1.5" onClick={() => setJoinDialogOpen(true)}>
                <CalendarCheck className="w-4 h-4" /> RSVP
              </Button>
            )}
            {event.donation_enabled && (
              <Button shape="pill" variant="outline" className="gap-1.5" onClick={() => setDonateDialogOpen(true)}>
                <Gift className="w-4 h-4" /> Donate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {event.sponsorship_enabled && (sponsorshipNeeds || []).length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-3">
            <HeartHandshake className="w-4 h-4" /> Sponsorship Opportunities
          </p>
          <div className="space-y-3">
            {(sponsorshipNeeds || []).map((need) => (
              <Card key={need.id}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{need.title}</p>
                    {need.description && <p className="text-xs text-muted-foreground mt-0.5">{need.description}</p>}
                  </div>
                  <ProgressMeter raised={Number(need.amount_raised)} target={Number(need.target_amount)} />
                  <Button size="sm" shape="pill" className="gap-1.5" onClick={() => setSponsorNeedId(need.id)}>
                    <HeartHandshake className="w-3.5 h-3.5" /> Sponsor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RSVP to {event.name}</DialogTitle>
          </DialogHeader>
          <GuestInfoFields value={joinGuest} onChange={setJoinGuest} />
          <DialogFooter>
            <Button
              disabled={!isGuestValid(joinGuest) || joinMutation.isPending}
              onClick={() =>
                joinMutation.mutate(
                  { event_id: event.id, type: "join", guest: joinGuest },
                  {
                    onSuccess: () => {
                      setJoinDialogOpen(false);
                      navigate(`/g/${subdomain}/thank-you`);
                    },
                  }
                )
              }
            >
              Confirm RSVP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Donate to {event.name}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Amount (₹)</label>
            <Input type="number" min="1" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} placeholder="e.g. 501" />
          </div>
          <GuestInfoFields value={donateGuest} onChange={setDonateGuest} />
          <DialogFooter>
            <Button
              disabled={!isGuestValid(donateGuest) || !donateAmount || Number(donateAmount) <= 0 || donateMutation.isPending}
              onClick={() =>
                donateMutation.mutate(
                  { event_id: event.id, amount: Number(donateAmount), guest: donateGuest },
                  {
                    onSuccess: () => {
                      setDonateDialogOpen(false);
                      navigate(`/g/${subdomain}/thank-you`);
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

      <Dialog open={!!sponsorNeedId} onOpenChange={(open) => !open && setSponsorNeedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sponsor This</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Pledge Amount (₹)</label>
            <Input type="number" min="1" value={sponsorAmount} onChange={(e) => setSponsorAmount(e.target.value)} placeholder="e.g. 5000" />
          </div>
          <GuestInfoFields value={sponsorGuest} onChange={setSponsorGuest} />
          <DialogFooter>
            <Button
              disabled={!isGuestValid(sponsorGuest) || !sponsorAmount || Number(sponsorAmount) <= 0 || sponsorMutation.isPending}
              onClick={() =>
                sponsorNeedId &&
                sponsorMutation.mutate(
                  { sponsorship_need_id: sponsorNeedId, amount_pledged: Number(sponsorAmount), guest: sponsorGuest },
                  {
                    onSuccess: () => {
                      setSponsorNeedId(null);
                      navigate(`/g/${subdomain}/thank-you`);
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
    </GuestShell>
  );
}
