import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/reusable ui/StatusChip";
import { CalendarDays, MapPin } from "lucide-react";
import { getPublicEvents } from "@/features/member/api/events";
import { useGuestOrganization } from "../hooks/useGuest";
import GuestShell from "../components/GuestShell";

export default function GuestLanding() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const { data: organization, isLoading: loadingOrg, isError: orgError } = useGuestOrganization(subdomain);
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["guest-public-events", subdomain],
    queryFn: () => getPublicEvents(subdomain!),
    enabled: !!subdomain,
  });

  if (loadingOrg) {
    return (
      <GuestShell>
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </GuestShell>
    );
  }

  if (orgError || !organization) {
    return (
      <GuestShell>
        <p className="text-sm text-muted-foreground text-center py-16">This community page could not be found.</p>
      </GuestShell>
    );
  }

  return (
    <GuestShell organization={organization}>
      <h1 className="text-xl font-bold text-foreground mb-1">{organization.organization_name}</h1>
      <p className="text-sm text-muted-foreground mb-6">Upcoming events open to the public</p>

      {loadingEvents ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No public events right now — check back soon.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="cursor-pointer" onClick={() => navigate(`/g/${subdomain}/events/${event.id}`)}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{event.name}</h3>
                  <StatusChip status={event.event_type} />
                </div>
                {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {event.start_date}
                    {event.is_multi_day ? ` → ${event.end_date}` : ""}
                  </span>
                  {event.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {event.venue}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </GuestShell>
  );
}
