import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusChip from "@/components/reusable ui/StatusChip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarEvents } from "../hooks/useCalendar";
import { CommunityEvent } from "../api/events";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_PILLS_PER_CELL = 3;

const EVENT_DOT_COLOR: Record<string, string> = {
  draft: "bg-muted-foreground/50",
  published: "bg-success",
  cancelled: "bg-destructive",
  completed: "bg-secondary",
};

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** "YYYY-MM-DD" built from local date fields — never toISOString(), which
 * converts through UTC and can shift the date by a day in some timezones. */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthRange(year: number, month: number): { from: string; to: string } {
  return { from: toLocalDateKey(new Date(year, month, 1)), to: toLocalDateKey(new Date(year, month + 1, 0)) };
}

/** Full weeks covering the month, padded with the tail of the previous
 * month and head of the next — the standard Outlook/Google month grid. */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

  const lastOfMonth = new Date(year, month + 1, 0);
  const gridEnd = new Date(year, month + 1, lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function EventPill({ event, onClick }: { event: CommunityEvent; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={event.name}
      className="w-full text-left text-[11px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-1 hover:bg-muted transition-colors"
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", EVENT_DOT_COLOR[event.status] || "bg-muted-foreground/50")} />
      <span className="truncate text-foreground">{event.name}</span>
    </button>
  );
}

function EventCard({ event, onClick }: { event: CommunityEvent; onClick: () => void }) {
  return (
    <Card className="cursor-pointer" onClick={onClick}>
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{event.name}</p>
          {event.venue && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {event.venue}
            </p>
          )}
        </div>
        <StatusChip status={event.status} />
      </CardContent>
    </Card>
  );
}

export default function CommunityCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dayDialogDate, setDayDialogDate] = useState<string | null>(null);

  const { from, to } = useMemo(() => monthRange(year, month), [year, month]);
  const { data: events, isLoading } = useCalendarEvents(from, to);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CommunityEvent[]>();
    (events || []).forEach((e) => {
      map.set(e.start_date, [...(map.get(e.start_date) || []), e]);
    });
    return map;
  }, [events]);

  const sortedGroups = useMemo(() => [...eventsByDate.entries()].sort(([a], [b]) => a.localeCompare(b)), [eventsByDate]);
  const gridDates = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toLocalDateKey(today);
  const dayDialogEvents = dayDialogDate ? eventsByDate.get(dayDialogDate) || [] : [];

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  return (
    <Layout title="Calendar" subtitle="Everything happening in your community" icon={<CalendarDays className="w-5 h-5" />}>
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={goPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="font-semibold text-foreground min-w-[150px] text-center">{monthLabel(year, month)}</p>
            <Button size="sm" variant="outline" onClick={goNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={goToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            <button
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors",
                view === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Calendar
            </button>
            <button
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors",
                view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
              onClick={() => setView("list")}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : view === "grid" ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 bg-muted/50">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {gridDates.map((date) => {
                const key = toLocalDateKey(date);
                const inMonth = date.getMonth() === month;
                const dayEvents = eventsByDate.get(key) || [];
                const visible = dayEvents.slice(0, MAX_PILLS_PER_CELL);
                const overflow = dayEvents.length - visible.length;
                const isToday = key === todayKey;
                return (
                  <div key={key} className={cn("min-h-[104px] border-t border-l border-border p-1.5", !inMonth && "bg-muted/20")}>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mb-1",
                        isToday ? "bg-primary text-primary-foreground font-semibold" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="space-y-0.5">
                      {visible.map((event) => (
                        <EventPill key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
                      ))}
                      {overflow > 0 && (
                        <button className="text-[11px] text-primary font-medium px-1 hover:underline" onClick={() => setDayDialogDate(key)}>
                          +{overflow} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : sortedGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No events scheduled this month.</p>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {sortedGroups.map(([date, dayEvents]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  {parseLocalDateKey(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!dayDialogDate} onOpenChange={(open) => !open && setDayDialogDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dayDialogDate && parseLocalDateKey(dayDialogDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {dayDialogEvents.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
