"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useModal } from "@/components/ModalHost";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  flattenComponents,
  useEvent,
  useFeaturedEvent,
  useSponsorshipNeeds,
  useVolunteerRoles,
} from "@/lib/hooks/useEvents";
import { useMembers } from "@/lib/hooks/useActivity";
import {
  daysFromToday,
  describeWhen,
  formatDateRange,
  formatMoneyCompact,
  toNumber,
} from "@/lib/utils/format";
import type { TabId } from "@/components/TabNav";

/**
 * Festive banner for the event that's on now, or starting within a week.
 *
 * Renders nothing outside that window -- per spec the banner only appears when
 * something is imminent, rather than always occupying the fold.
 *
 * Layout is `.u-hero`, which collapses to a single column below 64rem so the
 * stats stack under the greeting instead of being squeezed.
 */
export function Hero({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { open } = useModal();
  const { user, membership } = useAuth();

  const { event, isLoading } = useFeaturedEvent(7);

  const detail = useEvent(event?.id);
  const roles = useVolunteerRoles(event?.id);
  const needs = useSponsorshipNeeds(event?.id);
  const members = useMembers();

  // The hero always renders: the greeting, membership ID and member count are
  // meaningful even with no event on the horizon. Only the event-specific
  // pieces (banner pill, activity/volunteer/sponsorship stats, event card) are
  // gated on `event`. While the featured-event lookup is still loading we hold
  // off so the layout doesn't flash between the two states.
  if (isLoading) return null;

  const components = flattenComponents(detail.data?.days);
  const dayCount = detail.data?.days?.length ?? 0;

  const volunteersSignedUp = (roles.data ?? []).reduce(
    (sum, r) => sum + r.headcount_filled,
    0,
  );
  const raised = (needs.data ?? []).reduce(
    (sum, n) => sum + toNumber(n.amount_raised),
    0,
  );

  const isLive = event ? daysFromToday(event.start_date) <= 0 : false;

  return (
    <section
      aria-label="Highlights"
      style={{
        background:
          "linear-gradient(135deg,var(--color-teal-dark) 0%,var(--color-teal) 50%,#128a80 100%)",
        position: "relative",
        overflow: "hidden",
        borderBottom: "0.1875rem solid var(--color-gold-light)",
      }}
    >
      <div style={glow(300, "rgba(232,101,10,.18)", { right: "-4rem", top: "-5rem" })} />
      <div
        style={glow(200, "rgba(196,136,10,.12)", { left: "35%", bottom: "-4rem" })}
      />
      <div
        className="hero-pattern"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      <div className="u-hero u-container" style={{ position: "relative", zIndex: 1 }}>
        {/* Left */}
        <div className="u-min0">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: "rgba(240,192,64,.18)",
              border: "1px solid rgba(240,192,64,.4)",
              borderRadius: "var(--radius-pill)",
              padding: "0.3125rem 0.875rem",
              fontSize: "var(--text-2xs)",
              fontWeight: 600,
              color: "var(--color-gold-light)",
              marginBottom: "var(--space-3)",
              lineHeight: 1.4,
            }}
          >
            <Icon name="ti-calendar-event" size={13} />
            {!event
              ? "Welcome to your community"
              : isLive
                ? `${event.name} is happening now`
                : `${event.name} begins ${describeWhen(event.start_date)}`}
          </span>

          <h1
            style={{
              // Fluid: scales with viewport but never below a readable size.
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 var(--space-2)",
              lineHeight: 1.25,
            }}
          >
            {greeting()}
            {user?.firstName ? `, ${user.firstName}` : ""} 👋
          </h1>

          {event && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "rgba(255,255,255,.78)",
                margin: "0 0 var(--space-4)",
                maxWidth: "28rem",
                lineHeight: 1.55,
              }}
            >
              {`Here's what's happening in your community${isLive ? " right now" : " this week"}.`}
            </p>
          )}

          <div className="u-hero-actions">
            <Button
              variant="saffron"
              onClick={() => onNavigate("events")}
            >
              <Icon name="ti-calendar-event" size={15} /> View all events
            </Button>
            <Button
              onClick={() => onNavigate("my-activity")}
              style={{
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                borderColor: "rgba(255,255,255,.28)",
              }}
            >
              <Icon name="ti-clipboard-list" size={15} /> My activity
            </Button>
            {event?.volunteer_enabled && (
              <Button
                onClick={() => open({ kind: "volunteer", eventId: event.id })}
                style={{
                  background: "rgba(255,255,255,.12)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.28)",
                }}
              >
                <Icon name="ti-heart-handshake" size={15} /> Volunteer
              </Button>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="u-stack u-stack--sm u-min0">
          {/* Membership id sits above the member stats, per spec. */}
          {membership && (
            <div
              className="u-row u-row--between"
              style={{
                padding: "0.375rem 0.75rem",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "var(--radius-s)",
                gap: "var(--space-2)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: 600,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.6)",
                }}
              >
                Membership ID
              </span>
              <code
                style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: 700,
                  color: "var(--color-gold-light)",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  wordBreak: "break-all",
                }}
                title={membership.id}
              >
                {membership.id.slice(0, 8).toUpperCase()}
              </code>
            </div>
          )}

          <div className="u-hero-stats">
            <HeroStat
              num={members.data ? String(members.data.length) : "—"}
              lbl="Members"
              sub="In the directory"
            />
            {/* Activity/volunteer/sponsorship figures only make sense against a
                featured event; omit them entirely when there isn't one. */}
            {event && (
              <>
                <HeroStat
                  num={String(components.length)}
                  lbl="Activities"
                  sub={dayCount > 1 ? `Across ${dayCount} days` : "This event"}
                />
                <HeroStat
                  num={String(volunteersSignedUp)}
                  lbl="Volunteers"
                  sub="Signed up"
                />
                <HeroStat
                  num={raised > 0 ? formatMoneyCompact(raised) : "—"}
                  lbl="Sponsorships"
                  sub="Raised so far"
                />
              </>
            )}
          </div>

          {event && (
          <button
            type="button"
            onClick={() => onNavigate("events")}
            className="u-hero-eventcard"
            style={{
              textAlign: "left",
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.18)",
              borderRadius: "var(--radius-card)",
              padding: "var(--space-3)",
              cursor: "pointer",
              fontFamily: "inherit",
              minHeight: "var(--tap)",
            }}
          >
            <span
              className="u-row"
              style={{ gap: "var(--space-2)", marginBottom: "var(--space-1)" }}
            >
              <span style={{ fontSize: "var(--text-lg)" }} aria-hidden="true">
                {event.event_type === "festival" ? "🐘" : "📅"}
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {event.name}
              </span>
            </span>
            <span
              className="u-row"
              style={{
                fontSize: "var(--text-2xs)",
                color: "rgba(255,255,255,.7)",
                gap: "var(--space-3)",
              }}
            >
              <span className="u-row" style={{ gap: "var(--space-1)" }}>
                <Icon name="ti-calendar" size={12} />
                {formatDateRange(event.start_date, event.end_date)}
              </span>
              {event.venue && (
                <span className="u-row" style={{ gap: "var(--space-1)" }}>
                  <Icon name="ti-map-pin" size={12} /> {event.venue}
                </span>
              )}
              <span className="u-row" style={{ gap: "var(--space-1)" }}>
                <Icon name="ti-list" size={12} /> {components.length} activities
              </span>
            </span>
          </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Time-derived rather than hardcoded, so the greeting is always truthful. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function glow(
  size: number,
  color: string,
  pos: React.CSSProperties,
): React.CSSProperties {
  return {
    position: "absolute",
    width: `${size / 16}rem`,
    height: `${size / 16}rem`,
    borderRadius: "50%",
    background: `radial-gradient(circle,${color} 0%,transparent 70%)`,
    pointerEvents: "none",
    ...pos,
  };
}

function HeroStat({
  num,
  lbl,
  sub,
}: {
  num: string;
  lbl: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.1)",
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: "var(--radius-card)",
        padding: "0.625rem 0.75rem",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          color: "var(--color-gold-light)",
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          color: "rgba(255,255,255,.78)",
          marginTop: "var(--space-1)",
          fontWeight: 500,
        }}
      >
        {lbl}
      </div>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          color: "rgba(255,255,255,.55)",
          marginTop: "0.125rem",
        }}
      >
        {sub}
      </div>
    </div>
  );
}
