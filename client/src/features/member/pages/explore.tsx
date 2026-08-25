import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/reusable ui/StatusChip";
import { CalendarDays, MapPin, Plus, Sparkles } from "lucide-react";
import { useEvents } from "../hooks/useEvents";

export default function Explore() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: events, isLoading } = useEvents({ status: statusFilter });

  const filters: { label: string; value?: string }[] = [
    { label: "All", value: undefined },
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <Layout title="Explore" subtitle="Activities happening in your community" icon={<Sparkles className="w-5 h-5" />}>
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button shape="pill" className="gap-1" onClick={() => navigate("/create-activity")}>
            <Plus className="w-4 h-4" /> Create Activity
          </Button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No activities yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to create one for your community.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover-lift hover:shadow-medium transition-all"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground leading-tight">{event.name}</h3>
                    <StatusChip status={event.status} />
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {event.start_date}
                      {event.is_multi_day ? ` → ${event.end_date}` : ""}
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.venue}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
