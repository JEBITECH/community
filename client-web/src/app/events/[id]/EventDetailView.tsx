"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { ModalHost, useModal } from "@/components/ModalHost";
import { Topbar } from "@/components/Topbar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { LoadingRows, NotAvailable } from "@/components/ui/NotAvailable";
import { useEvent, useVolunteerRoles } from "@/lib/hooks/useEvents";
import {
  useMyParticipationIndex,
  useMyVolunteerRoleIds,
} from "@/lib/hooks/useActivity";
import {
  describeWhen,
  formatDate,
  formatDateRange,
  formatDateWeekday,
  formatTime,
  formatTimeRange,
  humanize,
} from "@/lib/utils/format";
import type {
  CommunityEvent,
  EventComponent,
  EventDay,
} from "@/lib/api/types";

/** Presentational emoji per event type — decoration only. */
function emojiFor(event?: CommunityEvent): string {
  switch (event?.event_type) {
    case "festival": return "🎉";
    case "sports": return "🏏";
    case "workshop": return "🧘";
    case "cultural": return "🎭";
    case "community_program": return "🌿";
    case "meeting": return "📋";
    case "fundraising": return "💝";
    default: return "📅";
  }
}

export function EventDetailView({ eventId }: { eventId: string }) {
  return (
    <AuthGate>
      <ModalHost>
        <div className="deco-strip" />
        <Topbar />
        <main id="main" className="u-container u-page-pad">
          <Detail eventId={eventId} />
        </main>
      </ModalHost>
    </AuthGate>
  );
}

function Detail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { data: event, isLoading, isError } = useEvent(eventId);

  // Return to wherever the user came from (the Events tab on the home screen).
  // Prefer real browser history so scroll position is preserved; fall back to
  // the home route ("/") since there is no standalone "/events" list page.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const days = useMemo(
    () =>
      [...(event?.days ?? [])].sort((a, b) => a.day_number - b.day_number),
    [event?.days],
  );

  // Default the day selector to today if the event is running, else day 1.
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const activeDay =
    days.find((d) => d.id === activeDayId) ?? pickDefaultDay(days) ?? null;

  if (isLoading) {
    return (
      <div style={{ marginTop: "var(--space-4)" }}>
        <LoadingRows rows={4} />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div style={{ marginTop: "var(--space-4)" }}>
        <NotAvailable
          title="Couldn't load this event"
          detail="It may have been removed, or you may not have access. Go back and try again."
        />
        <div style={{ marginTop: "var(--space-3)" }}>
          <Button variant="ghost" onClick={goBack}>
            <Icon name="ti-arrow-left" size={14} /> Back to events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="u-stack">
      <button
        type="button"
        onClick={goBack}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-1)",
          minHeight: "var(--tap)",
          padding: "0.25rem 0.5rem 0.25rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-tx3)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          fontFamily: "inherit",
        }}
      >
        <Icon name="ti-arrow-left" size={15} /> All events
      </button>

      <EventHero event={event} />

      {days.length === 0 ? (
        <NotAvailable
          title="No schedule published yet"
          detail="The committee hasn't added the day-by-day programme for this event."
        />
      ) : (
        <>
          <DaySelector
            days={days}
            activeDayId={activeDay?.id ?? ""}
            onSelect={setActiveDayId}
          />
          {activeDay && <DaySchedule event={event} day={activeDay} />}
        </>
      )}

      {event.volunteer_enabled && <VolunteerStrip eventId={event.id} />}
    </div>
  );
}

/* ── Hero header ────────────────────────────────────────────────────────── */

function EventHero({ event }: { event: CommunityEvent }) {
  const { open } = useModal();
  const { byEvent } = useMyParticipationIndex();
  const mine = byEvent.get(event.id);

  const live =
    describeWhen(event.start_date) === "today" ||
    (event.start_date <= todayStr() && event.end_date >= todayStr());

  return (
    <section
      aria-label={event.name}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-card)",
        // Festive teal→gold gradient, in the app's palette (not the mockup's orange).
        background:
          "linear-gradient(135deg,var(--color-teal-dark) 0%,var(--color-teal) 55%,#128a80 100%)",
        color: "#fff",
        border: "1px solid var(--color-teal-dark)",
      }}
    >
      <div
        className="hero-pattern"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
      {/* Oversized emblem, bleeding off the right edge. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-0.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "7rem",
          opacity: 0.16,
          lineHeight: 1,
        }}
      >
        {emojiFor(event)}
      </div>

      <div
        style={{
          position: "relative",
          padding: "clamp(1.25rem, 3vw, 2rem)",
          display: "grid",
          gap: "var(--space-3)",
        }}
      >
        <div className="u-row" style={{ gap: "var(--space-2)" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
              background: "rgba(240,192,64,.2)",
              border: "1px solid rgba(240,192,64,.45)",
              color: "var(--color-gold-light)",
              borderRadius: "var(--radius-pill)",
              padding: "0.25rem 0.75rem",
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            {humanize(event.event_type)}
          </span>
          {live && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-1)",
                background: "rgba(255,255,255,.16)",
                borderRadius: "var(--radius-pill)",
                padding: "0.25rem 0.6rem",
                fontSize: "var(--text-2xs)",
                fontWeight: 700,
              }}
            >
              ● Happening now
            </span>
          )}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.375rem, 3.5vw, 1.9rem)",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {event.name}
        </h1>

        {event.description && (
          <p
            style={{
              margin: 0,
              maxWidth: "42rem",
              fontSize: "var(--text-sm)",
              lineHeight: 1.6,
              color: "rgba(255,255,255,.82)",
            }}
          >
            {event.description}
          </p>
        )}

        {/* Facts row */}
        <div
          className="u-row"
          style={{ gap: "var(--space-4)", rowGap: "var(--space-2)" }}
        >
          <HeroFact icon="ti-calendar" label={formatDateRange(event.start_date, event.end_date)} />
          <HeroFact icon="ti-clock" label={describeWhen(event.start_date)} />
          {event.venue && <HeroFact icon="ti-map-pin" label={event.venue} />}
          {event.capacity != null && (
            <HeroFact icon="ti-users" label={`Capacity ${event.capacity}`} />
          )}
        </div>

        {/* Primary actions */}
        {event.status === "published" && (
          <div className="u-row" style={{ gap: "var(--space-2)" }}>
            {event.registration_required &&
              (mine ? (
                <Button
                  variant="joined"
                  onClick={() =>
                    open({ kind: "cancel", participationId: mine.id, label: event.name })
                  }
                >
                  <Icon name="ti-check" size={14} /> You&apos;re going · manage
                </Button>
              ) : (
                <Button
                  variant="saffron"
                  onClick={() => open({ kind: "join", eventId: event.id })}
                >
                  I&apos;m going
                </Button>
              ))}
            {event.volunteer_enabled && (
              <Button
                onClick={() => open({ kind: "volunteer", eventId: event.id })}
                style={{
                  background: "rgba(255,255,255,.14)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.3)",
                }}
              >
                <Icon name="ti-heart-handshake" size={14} /> Volunteer
              </Button>
            )}
          </div>
        )}
        {event.status === "cancelled" && <Tag tone="urgent">Event cancelled</Tag>}
      </div>
    </section>
  );
}

function HeroFact({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="u-row"
      style={{ gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "rgba(255,255,255,.9)" }}
    >
      <Icon name={icon} size={14} color="var(--color-gold-light)" />
      {label}
    </span>
  );
}

/* ── Day selector ───────────────────────────────────────────────────────── */

function DaySelector({
  days,
  activeDayId,
  onSelect,
}: {
  days: EventDay[];
  activeDayId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="u-scroll-x"
      role="tablist"
      aria-label="Event days"
      style={{ gap: "var(--space-2)", paddingBottom: "var(--space-1)" }}
    >
      {days.map((day) => {
        const active = day.id === activeDayId;
        const isToday = day.date === todayStr();
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(day.id)}
            style={{
              flexShrink: 0,
              minWidth: "5.5rem",
              minHeight: "var(--tap)",
              textAlign: "left",
              padding: "0.5rem 0.875rem",
              borderRadius: "var(--radius-card)",
              cursor: "pointer",
              fontFamily: "inherit",
              border: `0.09375rem solid ${active ? "var(--color-teal)" : "var(--color-bdr2)"}`,
              background: active ? "var(--color-teal)" : "#fff",
              color: active ? "#fff" : "var(--color-tx2)",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "var(--text-2xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".04em",
                opacity: active ? 0.85 : 0.6,
              }}
            >
              Day {day.day_number}
              {isToday ? " · Today" : ""}
            </span>
            <span
              style={{
                display: "block",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                marginTop: "0.125rem",
              }}
            >
              {formatDate(day.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Day schedule (timeline) ────────────────────────────────────────────── */

function DaySchedule({ event, day }: { event: CommunityEvent; day: EventDay }) {
  const components = useMemo(
    () => [...(day.components ?? [])].sort((a, b) => a.sequence - b.sequence),
    [day.components],
  );

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "var(--space-3) var(--space-4)",
          borderBottom: "1px solid var(--color-bdr)",
          background: "linear-gradient(90deg,var(--color-teal-light),#fff)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--color-teal-dark)",
          }}
        >
          {day.title || `Day ${day.day_number}`}
        </h2>
        <p
          style={{
            margin: "0.125rem 0 0",
            fontSize: "var(--text-2xs)",
            color: "var(--color-tx3)",
          }}
        >
          {formatDateWeekday(day.date)}
        </p>
      </header>

      <div style={{ padding: "var(--space-4)" }}>
        {components.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--color-tx3)",
              textAlign: "center",
              padding: "var(--space-4) 0",
            }}
          >
            Nothing scheduled for this day yet.
          </p>
        ) : (
          components.map((c, i) => (
            <ScheduleRow
              key={c.id}
              eventId={event.id}
              component={c}
              last={i === components.length - 1}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ScheduleRow({
  eventId,
  component,
  last,
}: {
  eventId: string;
  component: EventComponent;
  last: boolean;
}) {
  return (
    <div className="u-timeline-row">
      <div
        className="u-timeline-time"
        style={{
          textAlign: "right",
          fontSize: "var(--text-2xs)",
          fontWeight: 700,
          color: "var(--color-saffron)",
          paddingTop: "0.375rem",
          lineHeight: 1.3,
        }}
      >
        {formatTime(component.start_time) || "All day"}
      </div>

      {/* Connector rail */}
      <div
        className="u-timeline-rail"
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <span
          style={{
            width: "0.625rem",
            height: "0.625rem",
            borderRadius: "50%",
            marginTop: "0.5rem",
            background: component.requires_booking
              ? "var(--color-gold)"
              : "var(--color-teal)",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px var(--color-bdr2)",
          }}
        />
        {!last && (
          <span style={{ flex: 1, width: "2px", background: "var(--color-bdr)", marginTop: "0.25rem" }} />
        )}
      </div>

      {/* Card */}
      <div
        className="u-min0"
        style={{
          background: "var(--color-ivory)",
          border: "1px solid var(--color-bdr)",
          borderRadius: "var(--radius-s)",
          padding: "0.75rem 0.875rem",
          marginBottom: "var(--space-3)",
        }}
      >
        <div className="u-row u-row--between" style={{ gap: "var(--space-2)" }}>
          <h3
            className="u-min0"
            style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-tx)" }}
          >
            {component.name}
          </h3>
          {component.component_type !== "activity" && (
            <Tag tone="muted">{humanize(component.component_type)}</Tag>
          )}
        </div>

        {component.description && (
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "var(--text-xs)",
              lineHeight: 1.55,
              color: "var(--color-tx2)",
            }}
          >
            {component.description}
          </p>
        )}

        <div
          className="u-row"
          style={{ gap: "var(--space-3)", marginTop: "0.5rem" }}
        >
          {(component.start_time || component.end_time) && (
            <MetaBit icon="ti-clock">
              {formatTimeRange(component.start_time, component.end_time)}
            </MetaBit>
          )}
          {component.location_resource && (
            <MetaBit icon="ti-map-pin">{humanize(component.location_resource)}</MetaBit>
          )}
          {component.capacity != null && (
            <MetaBit icon="ti-users">{component.capacity} spots</MetaBit>
          )}
        </div>

        <ScheduleRowAction eventId={eventId} component={component} />
      </div>
    </div>
  );
}

function MetaBit({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span
      className="u-row"
      style={{ gap: "var(--space-1)", fontSize: "var(--text-2xs)", color: "var(--color-tx3)" }}
    >
      <Icon name={icon} size={12} color="var(--color-teal)" />
      {children}
    </span>
  );
}

/** Join / Book / already-in state for a single activity. */
function ScheduleRowAction({
  eventId,
  component,
}: {
  eventId: string;
  component: EventComponent;
}) {
  const { open } = useModal();
  const { byComponent } = useMyParticipationIndex();
  const mine = byComponent.get(component.id);

  if (mine) {
    const participating = mine.registration_method === "participate";
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <div className="u-row" style={{ gap: "var(--space-2)" }}>
          <Button variant="joined" size="sm">
            <Icon name="ti-check" size={11} />{" "}
            {mine.type === "book" ? "Booked" : participating ? "Participating" : "Joined"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              open({ kind: "cancel", participationId: mine.id, label: component.name })
            }
          >
            Cancel
          </Button>
        </div>
        {participating && (
          <span
            style={{
              display: "block",
              marginTop: "0.25rem",
              fontSize: "var(--text-2xs)",
              color: "var(--color-tx3)",
            }}
          >
            {(mine.beneficiaries ?? []).map((b) => b.full_name).join(", ") ||
              "No participant details"}
          </span>
        )}
      </div>
    );
  }

  if (component.requires_booking) {
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <Button
          variant="book"
          size="sm"
          onClick={() => open({ kind: "book", eventId, componentId: component.id })}
        >
          <Icon name="ti-ticket" size={11} /> Book a spot
        </Button>
      </div>
    );
  }

  if (!component.registration_enabled && !component.participation_enabled) return null;

  return (
    <div className="u-row" style={{ gap: "var(--space-2)", marginTop: "0.5rem" }}>
      {component.registration_enabled && (
        <Button
          variant="join"
          size="sm"
          onClick={() => open({ kind: "join", eventId, componentId: component.id })}
        >
          Join
        </Button>
      )}
      {component.participation_enabled && (
        <Button
          variant="part"
          size="sm"
          onClick={() => open({ kind: "participate", eventId, componentId: component.id })}
        >
          Participate
        </Button>
      )}
    </div>
  );
}

/* ── Volunteer strip ────────────────────────────────────────────────────── */

function VolunteerStrip({ eventId }: { eventId: string }) {
  const { data: roles, isLoading } = useVolunteerRoles(eventId);
  const mineRoleIds = useMyVolunteerRoleIds();
  const { open } = useModal();

  if (isLoading) return null;
  const openRoles = (roles ?? []).filter((r) => r.status !== "closed");
  if (openRoles.length === 0) return null;

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "var(--space-3) var(--space-4)",
          borderBottom: "1px solid var(--color-bdr)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <Icon name="ti-heart-handshake" size={16} color="var(--color-teal)" />
        <h2 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-tx)" }}>
          Lend a hand
        </h2>
      </header>
      <div style={{ padding: "var(--space-3) var(--space-4)", display: "grid", gap: "var(--space-2)" }}>
        {openRoles.map((role) => {
          const left = Math.max(0, role.headcount_needed - role.headcount_filled);
          const full = left === 0;
          const signedUp = mineRoleIds.has(role.id);
          return (
            <div key={role.id} className="u-row u-row--between" style={{ gap: "var(--space-2)", paddingBlock: "0.25rem" }}>
              <div className="u-min0">
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-tx)" }}>
                  {role.title}
                </div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-tx3)" }}>
                  {formatTimeRange(role.slot_start, role.slot_end)}
                  {full ? " · fully staffed" : ` · ${left} of ${role.headcount_needed} needed`}
                </div>
              </div>
              {signedUp ? (
                <Button variant="joined" size="sm"><Icon name="ti-check" size={11} /> Applied</Button>
              ) : (
                <Button
                  variant="vol"
                  size="sm"
                  disabled={full}
                  onClick={() => open({ kind: "volunteer", eventId, roleId: role.id })}
                >
                  {full ? "Full" : "Apply"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function todayStr(): string {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

function pickDefaultDay(days: EventDay[]): EventDay | undefined {
  if (days.length === 0) return undefined;
  const today = todayStr();
  return days.find((d) => d.date === today) ?? days[0];
}
