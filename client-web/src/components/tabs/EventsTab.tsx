"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  EmptyNote,
  LoadingRows,
  NotAvailable,
} from "@/components/ui/NotAvailable";
import { SubTabs } from "@/components/TabNav";
import { useModal } from "@/components/ModalHost";
import {
  categorize,
  findTodayDay,
  useComponentAvailability,
  useEvent,
  usePublishedEvents,
  useVolunteerRolesForEvents,
} from "@/lib/hooks/useEvents";
import { useMyParticipationIndex, useMyVolunteerRoleIds } from "@/lib/hooks/useActivity";
import {
  describeWhen,
  formatDateFull,
  formatDateRange,
  formatDateWeekday,
  formatTime,
  formatTimeRange,
  humanize,
} from "@/lib/utils/format";
import type { CommunityEvent, EventComponent } from "@/lib/api/types";

type EventsSubTab = "today" | "all-events" | "volunteer";

const SUB_TABS: { id: EventsSubTab; icon: string; label: string }[] = [
  { id: "today", icon: "ti-sun", label: "Today's activities" },
  { id: "all-events", icon: "ti-calendar", label: "All events" },
  { id: "volunteer", icon: "ti-heart-handshake", label: "Volunteer" },
];

export function EventsTab() {
  const events = usePublishedEvents();

  const buckets = useMemo(() => categorize(events.data ?? []), [events.data]);
  const liveEvent = buckets.live[0] ?? null;

  // Detail is needed to know whether anything is actually scheduled today.
  const liveDetail = useEvent(liveEvent?.id);
  const todayDay = findTodayDay(liveDetail.data?.days);
  const hasToday = Boolean(todayDay?.components?.length);

  // Default to today's schedule only when there really is something on today,
  // otherwise land on the events list.
  const [sub, setSub] = useState<EventsSubTab>("all-events");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (pinned || events.isLoading || liveDetail.isLoading) return;
    setSub(hasToday ? "today" : "all-events");
  }, [hasToday, pinned, events.isLoading, liveDetail.isLoading]);

  function choose(next: EventsSubTab) {
    setPinned(true);
    setSub(next);
  }

  return (
    // Content + announcements rail; collapses to one column below 64rem.
    <div className="u-split">
      <div className="u-min0">
        <SubTabs tabs={SUB_TABS} active={sub} onChange={choose} />

        {sub === "today" && (
          <TodayView
            event={liveEvent}
            day={todayDay}
            loading={events.isLoading || liveDetail.isLoading}
            onSeeAll={() => choose("all-events")}
          />
        )}
        {sub === "all-events" && (
          <AllEventsView
            live={buckets.live}
            upcoming={buckets.upcoming}
            loading={events.isLoading}
          />
        )}
        {sub === "volunteer" && (
          <VolunteerView events={[...buckets.live, ...buckets.upcoming]} />
        )}
      </div>

      <AnnouncementsSidebar />
    </div>
  );
}

/* ─── Today ─── */

function TodayView({
  event,
  day,
  loading,
  onSeeAll,
}: {
  event: CommunityEvent | null;
  day: ReturnType<typeof findTodayDay>;
  loading: boolean;
  onSeeAll: () => void;
}) {
  if (loading) return <LoadingRows rows={3} />;

  const components = [...(day?.components ?? [])].sort(
    (a, b) => a.sequence - b.sequence,
  );

  if (!event || components.length === 0) {
    return (
      <EmptyNote>
        Nothing is scheduled for today. Check{" "}
        <button
          type="button"
          onClick={onSeeAll}
          style={{
            padding: "0rem",
            border: "none",
            background: "none",
            font: "inherit",
            color: "var(--color-teal)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          all events
        </button>{" "}
        for what&apos;s coming up.
      </EmptyNote>
    );
  }

  return (
    <>
      <SectionHeader
        icon="ti-sun"
        title={`Happening today — ${formatDateWeekday(day!.date)}`}
        right={
          <Button variant="ghost" size="sm" onClick={onSeeAll}>
            All events
          </Button>
        }
      />
      {components.map((component, i) => (
        <TimelineRow
          key={component.id}
          eventId={event.id}
          component={component}
          last={i === components.length - 1}
        />
      ))}
    </>
  );
}

function TimelineRow({
  eventId,
  component,
  last,
}: {
  eventId: string;
  component: EventComponent;
  last: boolean;
}) {
  return (
    // Time gutter + rail + card; the gutter and rail drop away on phones.
    <div className="u-timeline-row">
      <div
        className="u-timeline-time"
        style={{
          textAlign: "right",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-saffron)",
          paddingTop: "0.25rem",
        }}
      >
        {formatTime(component.start_time) || "All day"}
      </div>
      <div
        className="u-timeline-rail"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "0.5625rem",
            height: "0.5625rem",
            borderRadius: "50%",
            background: component.requires_booking
              ? "var(--color-gold)"
              : "var(--color-saffron)",
            border: "2px solid var(--color-ivory)",
            flexShrink: 0,
            marginTop: "0.1875rem",
          }}
        />
        {!last && (
          <div
            style={{
              flex: 1,
              width: "0.0625rem",
              background: "var(--color-saffron-mid)",
              marginTop: "0.1875rem",
            }}
          />
        )}
      </div>
      <div className="u-min0">
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-bdr)",
            borderRadius: "var(--radius-card)",
            padding: "0.6875rem 0.8125rem",
            marginBottom: "0.1875rem",
            boxShadow: "0 1px 3px rgba(14,123,120,.05)",
          }}
        >
          <h4
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-tx)",
              margin: "0rem",
            }}
          >
            {component.name}
          </h4>
          <div
            style={{
              fontSize: "var(--text-2xs)",
              color: "var(--color-tx3)",
              marginTop: "0.1875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              flexWrap: "wrap",
            }}
          >
            <Icon name="ti-clock" size={10} color="var(--color-teal)" />
            {formatTimeRange(component.start_time, component.end_time) ||
              "Time to be confirmed"}
            {component.location_resource && (
              <>
                <Icon name="ti-map-pin" size={10} color="var(--color-teal)" />
                {humanize(component.location_resource)}
              </>
            )}
          </div>
          <div
            style={{ display: "flex", gap: "0.3125rem", marginTop: "0.5rem", flexWrap: "wrap" }}
          >
            <ComponentAction eventId={eventId} component={component} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The one button a resident can act on for a component: book it when it needs
 * a reservation, join it when it just needs an RSVP, and reflect the state they
 * are already in.
 */
function ComponentAction({
  eventId,
  component,
}: {
  eventId: string;
  component: EventComponent;
}) {
  const { open } = useModal();
  const { byComponent } = useMyParticipationIndex();
  const tracksCapacity = component.requires_booking || component.capacity !== null;
  const availability = useComponentAvailability(component.id, tracksCapacity);

  const mine = byComponent.get(component.id);

  if (mine) {
    return (
      <>
        <Button variant="joined" size="sm">
          <Icon name="ti-check" size={11} />
          {mine.type === "book" ? "Booked" : "Joined"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            open({
              kind: "cancel",
              participationId: mine.id,
              label: component.name,
            })
          }
        >
          Cancel
        </Button>
      </>
    );
  }

  const left = availability.data?.available;
  const full = left !== null && left !== undefined && left <= 0;

  if (component.requires_booking) {
    return (
      <Button
        variant={full ? "ghost" : "book"}
        size="sm"
        disabled={full}
        onClick={() => open({ kind: "book", eventId, componentId: component.id })}
      >
        <Icon name="ti-ticket" size={11} />
        {full ? "Full" : left != null ? `Book · ${left} left` : "Book"}
      </Button>
    );
  }

  if (!component.registration_enabled) return null;

  return (
    <Button
      variant="join"
      size="sm"
      disabled={full}
      onClick={() => open({ kind: "join", eventId, componentId: component.id })}
    >
      {full ? "Full" : "Join"}
    </Button>
  );
}

/* ─── All events ─── */

function AllEventsView({
  live,
  upcoming,
  loading,
}: {
  live: CommunityEvent[];
  upcoming: CommunityEvent[];
  loading: boolean;
}) {
  if (loading) return <LoadingRows rows={3} />;

  const all = [...live, ...upcoming];

  if (all.length === 0) {
    return (
      <EmptyNote>
        No events have been published yet. Your committee will post them here.
      </EmptyNote>
    );
  }

  return (
    <>
      <SectionHeader icon="ti-calendar" title="All upcoming events" />
      {all.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </>
  );
}

function EventCard({ event }: { event: CommunityEvent }) {
  const { open } = useModal();
  const { byEvent } = useMyParticipationIndex();
  const mine = byEvent.get(event.id);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        marginBottom: "0.75rem",
        boxShadow: "0 1px 4px rgba(14,123,120,.05)",
      }}
      className="u-media"
    >
      <div
        className="u-media__figure"
        style={{
          width: "4.5rem",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--text-2xl)",
          background: "var(--color-ivory-dark)",
        }}
        aria-hidden="true"
      >
        {emojiFor(event)}
      </div>
      <div
        className="u-media__body u-min0"
        style={{
          flex: 1,
          padding: "0.8125rem 0.875rem",
          borderLeft: "1px solid var(--color-bdr)",
        }}
      >
        <div
          className="u-row u-row--between"
          style={{ marginBottom: "0.3125rem" }}
        >
          <div
            style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-tx)" }}
          >
            {event.name}
          </div>
          <StatusTag event={event} />
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.625rem",
            flexWrap: "wrap",
            marginBottom: "0.5rem",
          }}
        >
          <Meta icon="ti-calendar">
            {formatDateRange(event.start_date, event.end_date)}
          </Meta>
          <Meta icon="ti-clock">{describeWhen(event.start_date)}</Meta>
          {event.venue && <Meta icon="ti-map-pin">{event.venue}</Meta>}
          <Meta icon="ti-tag">{humanize(event.event_type)}</Meta>
        </div>

        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {event.registration_required &&
            (mine ? (
              <>
                <Button variant="joined" size="sm">
                  <Icon name="ti-check" size={11} /> Going
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    open({
                      kind: "cancel",
                      participationId: mine.id,
                      label: event.name,
                    })
                  }
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="join"
                size="sm"
                onClick={() => open({ kind: "join", eventId: event.id })}
              >
                I&apos;m going
              </Button>
            ))}

          {event.volunteer_enabled && (
            <Button
              variant="vol"
              size="sm"
              onClick={() => open({ kind: "volunteer", eventId: event.id })}
            >
              <Icon name="ti-heart-handshake" size={11} /> Volunteer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontSize: "var(--text-xs)",
        color: "var(--color-tx2)",
        display: "flex",
        alignItems: "center",
        gap: "0.1875rem",
      }}
    >
      <Icon name={icon} size={11} /> {children}
    </span>
  );
}

function StatusTag({ event }: { event: CommunityEvent }) {
  const delta = describeWhen(event.start_date);

  if (event.status === "cancelled") return <Tag tone="urgent">Cancelled</Tag>;
  if (delta === "today" || event.start_date < event.end_date)
    return <Tag tone="done">Ongoing</Tag>;
  if (event.registration_required)
    return <Tag tone="part">Registration open</Tag>;
  return <Tag tone="muted">Coming soon</Tag>;
}

/** Event types don't carry an icon, so this is presentation-only decoration. */
function emojiFor(event: CommunityEvent): string {
  switch (event.event_type) {
    case "festival":
      return "🐘";
    case "cultural":
      return "🎭";
    case "sports":
      return "🏏";
    case "workshop":
      return "🛠️";
    case "educational_program":
      return "📚";
    case "meeting":
      return "📋";
    case "fundraising":
      return "💝";
    default:
      return "📅";
  }
}

/* ─── Volunteer ─── */

function VolunteerView({ events }: { events: CommunityEvent[] }) {
  const volunteerEvents = useMemo(
    () => events.filter((e) => e.volunteer_enabled),
    [events],
  );
  const { groups, isLoading } = useVolunteerRolesForEvents(volunteerEvents);
  const myRoleIds = useMyVolunteerRoleIds();
  const { open } = useModal();

  if (isLoading) return <LoadingRows rows={2} />;

  if (groups.length === 0) {
    return (
      <EmptyNote>
        No volunteer roles are open right now. They&apos;ll appear here when the
        committee opens them.
      </EmptyNote>
    );
  }

  return (
    <>
      <SectionHeader
        icon="ti-heart-handshake"
        title="Volunteer opportunities"
      />
      {groups.map(({ event, roles }) =>
        roles.map((role) => {
          const left = Math.max(
            0,
            role.headcount_needed - role.headcount_filled,
          );
          const full = left === 0;
          const signedUp = myRoleIds.has(role.id);
          const pct =
            role.headcount_needed > 0
              ? Math.round(
                  (role.headcount_filled / role.headcount_needed) * 100,
                )
              : 0;

          return (
            <div
              key={role.id}
              style={{
                background: "#fff",
                border: "1px solid var(--color-bdr)",
                borderRadius: "var(--radius-card)",
                overflow: "hidden",
                marginBottom: "0.75rem",
                boxShadow: "0 1px 4px rgba(14,123,120,.05)",
              }}
              className="u-media"
            >
              <div
                className="u-media__figure"
                style={{
                  width: "4.5rem",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-teal-light)",
                }}
              >
                <Icon
                  name="ti-heart-handshake"
                  size={28}
                  color="var(--color-teal)"
                />
              </div>
              <div
                className="u-media__body u-min0"
                style={{
                  flex: 1,
                  padding: "0.8125rem 0.875rem",
                  borderLeft: "1px solid var(--color-bdr)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-tx)",
                    marginBottom: "0.3125rem",
                  }}
                >
                  {role.title}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.625rem",
                    flexWrap: "wrap",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Meta icon="ti-calendar">{event.name}</Meta>
                  {(role.slot_start || role.slot_end) && (
                    <Meta icon="ti-clock">
                      {formatTimeRange(role.slot_start, role.slot_end)}
                    </Meta>
                  )}
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: full ? "#8b1010" : "var(--color-teal)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.1875rem",
                      fontWeight: 600,
                    }}
                  >
                    <Icon name="ti-users" size={11} />
                    {full
                      ? "Fully staffed"
                      : `${left} of ${role.headcount_needed} needed`}
                  </span>
                </div>

                <ProgressBar
                  value={pct}
                  color="var(--color-teal)"
                  width={200}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "0.375rem",
                    flexWrap: "wrap",
                    marginTop: "0.5rem",
                  }}
                >
                  {signedUp ? (
                    <Button variant="joined" size="sm">
                      <Icon name="ti-check" size={11} /> Applied
                    </Button>
                  ) : (
                    <Button
                      variant="vol"
                      size="sm"
                      disabled={full}
                      onClick={() =>
                        open({
                          kind: "volunteer",
                          eventId: event.id,
                          roleId: role.id,
                        })
                      }
                    >
                      <Icon name="ti-heart-handshake" size={11} />
                      {full ? "Full" : "Apply"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }),
      )}
    </>
  );
}

/* ─── Announcements sidebar ─── */

function AnnouncementsSidebar() {
  const events = usePublishedEvents();
  const buckets = useMemo(() => categorize(events.data ?? []), [events.data]);
  const next = [...buckets.live, ...buckets.upcoming].slice(0, 4);

  return (
    <div>
      <SectionHeader icon="ti-speakerphone" title="Announcements" />

      {/*
        There is no announcements table or endpoint in community-svc, so rather
        than reinstate the prototype's invented notices this states the gap and
        falls back to the real upcoming schedule.
      */}
      <NotAvailable
        title="Announcements aren't wired up yet"
        detail="community-svc has no announcements endpoint. Once it exists, committee notices will appear here."
      />

      <div style={{ marginTop: "1rem" }}>
        <SectionHeader icon="ti-calendar-event" title="Next up" />
        {next.length === 0 ? (
          <EmptyNote>Nothing scheduled.</EmptyNote>
        ) : (
          next.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#fff",
                borderLeft: "3px solid var(--color-teal)",
                border: "1px solid var(--color-bdr)",
                borderLeftWidth: 3,
                borderRadius: "var(--radius-s)",
                padding: "0.625rem 0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--color-tx)",
                }}
              >
                {event.name}
              </div>
              <div
                style={{
                  marginTop: "0.1875rem",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-tx3)",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <span>{formatDateFull(event.start_date)}</span>
                <span>·</span>
                <span>{describeWhen(event.start_date)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
