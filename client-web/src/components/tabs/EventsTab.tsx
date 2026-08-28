"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubTabs } from "@/components/TabNav";
import { useModal } from "@/components/ModalHost";
import {
  ANNOUNCEMENTS,
  EVENTS,
  TODAY_TIMELINE,
  VOLUNTEER_OPPS,
} from "@/lib/data";
import type {
  Announcement,
  AnnouncementTone,
  EventItem,
  EventStatus,
  TimelineActivity,
  VolunteerOpp,
} from "@/lib/types";
import type { ButtonVariant } from "@/components/ui/Button";

type EventsSubTab = "today" | "all-events" | "volunteer";

const SUB_TABS: { id: EventsSubTab; icon: string; label: string }[] = [
  { id: "today", icon: "ti-sun", label: "Today's activities" },
  { id: "all-events", icon: "ti-calendar", label: "All events" },
  { id: "volunteer", icon: "ti-heart-handshake", label: "Volunteer" },
];

export function EventsTab() {
  const [sub, setSub] = useState<EventsSubTab>("today");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        gap: 22,
        alignItems: "start",
      }}
    >
      <div>
        <SubTabs tabs={SUB_TABS} active={sub} onChange={setSub} />
        {sub === "today" && <TodayView />}
        {sub === "all-events" && <AllEventsView />}
        {sub === "volunteer" && <VolunteerView />}
      </div>
      <AnnouncementsSidebar />
    </div>
  );
}

/* ─── Today ─── */
function TodayView() {
  return (
    <>
      <SectionHeader
        icon="ti-sun"
        title="Happening today — 20 September"
        right={
          <Button variant="ghost" size="sm">
            Full schedule
          </Button>
        }
      />
      {TODAY_TIMELINE.map((item, i) => (
        <TimelineRow
          key={item.id}
          item={item}
          last={i === TODAY_TIMELINE.length - 1}
        />
      ))}
    </>
  );
}

function TimelineRow({
  item,
  last,
}: {
  item: TimelineActivity;
  last: boolean;
}) {
  const { open } = useModal();
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 58,
          flexShrink: 0,
          textAlign: "right",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--color-saffron)",
          paddingTop: 4,
        }}
      >
        {item.time}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 14,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: item.dotColor || "var(--color-saffron)",
            border: "2px solid var(--color-ivory)",
            flexShrink: 0,
            marginTop: 3,
          }}
        />
        {!last && (
          <div
            style={{
              flex: 1,
              width: 1,
              background: "var(--color-saffron-mid)",
              marginTop: 3,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-bdr)",
            borderRadius: "var(--radius-card)",
            padding: "11px 13px",
            marginBottom: 3,
            boxShadow: "0 1px 3px rgba(14,123,120,.05)",
          }}
        >
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-tx)", margin: 0 }}>
            {item.title}
          </h4>
          <div
            style={{
              fontSize: 10,
              color: "var(--color-tx3)",
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <Icon
              name={item.metaIcon}
              size={10}
              color={item.metaIconColor || "var(--color-teal)"}
            />
            {item.meta}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
            <Button
              variant={actionVariant(item.action.kind)}
              size="sm"
              onClick={item.action.modal ? () => open(item.action.modal!) : undefined}
            >
              {item.action.kind === "joined" && <Icon name="ti-check" size={11} />}
              {item.action.kind === "volunteer" && (
                <Icon name="ti-heart-handshake" size={11} />
              )}
              {item.action.kind === "book" && <Icon name="ti-ticket" size={11} />}
              {item.action.label}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── All events ─── */
function AllEventsView() {
  return (
    <>
      <SectionHeader
        icon="ti-calendar"
        title="All upcoming events"
        right={
          <Button variant="ghost" size="sm">
            Filter
          </Button>
        }
      />
      {EVENTS.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const { open } = useModal();
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        marginBottom: 12,
        display: "flex",
        boxShadow: "0 1px 4px rgba(14,123,120,.05)",
      }}
    >
      <div
        style={{
          width: 72,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          background: "var(--color-ivory-dark)",
        }}
      >
        {event.emoji}
      </div>
      <div
        style={{
          flex: 1,
          padding: "13px 14px",
          minWidth: 0,
          borderLeft: "1px solid var(--color-bdr)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 5,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tx)" }}>
            {event.title}
          </div>
          <StatusTag status={event.status} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          {event.meta.map((m, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                color: "var(--color-tx2)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Icon name={m.icon} size={11} /> {m.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {event.actions.map((a, i) => (
            <Button
              key={i}
              variant={actionVariant(a.kind)}
              size="sm"
              onClick={a.modal ? () => open(a.modal!) : undefined}
            >
              {a.icon && <Icon name={a.icon} size={11} />}
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: EventStatus }) {
  switch (status) {
    case "ongoing":
      return <Tag tone="done">Ongoing</Tag>;
    case "coming-soon":
      return <Tag tone="muted">Coming soon</Tag>;
    case "registration-open":
      return <Tag tone="part">Registration open</Tag>;
    case "urgent":
      return <Tag tone="urgent">Urgent</Tag>;
  }
}

/* ─── Volunteer ─── */
function VolunteerView() {
  const { open } = useModal();
  const tint: Record<VolunteerOpp["iconTint"], { bg: string; fg: string }> = {
    saffron: { bg: "var(--color-saffron-light)", fg: "var(--color-saffron)" },
    teal: { bg: "var(--color-teal-light)", fg: "var(--color-teal)" },
    gold: { bg: "var(--color-gold-pale)", fg: "var(--color-gold)" },
  };
  return (
    <>
      <SectionHeader icon="ti-heart-handshake" title="Volunteer opportunities" />
      {VOLUNTEER_OPPS.map((v) => (
        <div
          key={v.id}
          style={{
            background: "#fff",
            border: "1px solid var(--color-bdr)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
            marginBottom: 12,
            display: "flex",
            boxShadow: "0 1px 4px rgba(14,123,120,.05)",
          }}
        >
          <div
            style={{
              width: 72,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: tint[v.iconTint].bg,
            }}
          >
            <Icon name={v.icon} size={28} color={tint[v.iconTint].fg} />
          </div>
          <div
            style={{
              flex: 1,
              padding: "13px 14px",
              minWidth: 0,
              borderLeft: "1px solid var(--color-bdr)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tx)", marginBottom: 5 }}>
              {v.title}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--color-tx2)", display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name="ti-calendar" size={11} /> {v.date}
              </span>
              <span style={{ fontSize: 11, color: tint[v.iconTint].fg, display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name="ti-users" size={11} /> {v.spots}
              </span>
            </div>
            <ProgressBar value={v.progress} color={tint[v.iconTint].fg} width={200} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <Button variant="vol" size="sm" onClick={() => open("vol")}>
                <Icon name="ti-heart-handshake" size={11} /> Apply
              </Button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Announcements sidebar ─── */
function AnnouncementsSidebar() {
  return (
    <div>
      <SectionHeader
        icon="ti-speakerphone"
        title="Announcements"
        right={
          <Button variant="ghost" size="sm">
            See all
          </Button>
        }
      />
      {ANNOUNCEMENTS.map((a) => (
        <AnnouncementCard key={a.id} a={a} />
      ))}
    </div>
  );
}

const TONE: Record<
  AnnouncementTone,
  { border: string; iconBg: string; iconFg: string; badgeBg: string; badgeFg: string }
> = {
  saf: {
    border: "var(--color-saffron)",
    iconBg: "var(--color-saffron-light)",
    iconFg: "var(--color-saffron)",
    badgeBg: "var(--color-saffron-light)",
    badgeFg: "var(--color-saffron-dark)",
  },
  tel: {
    border: "var(--color-teal)",
    iconBg: "var(--color-teal-light)",
    iconFg: "var(--color-teal)",
    badgeBg: "var(--color-teal-light)",
    badgeFg: "var(--color-teal-dark)",
  },
  grn: {
    border: "#1a8a40",
    iconBg: "#e8f6e8",
    iconFg: "#1a8a40",
    badgeBg: "#e8f6e8",
    badgeFg: "#1a6a20",
  },
  red: {
    border: "#c02020",
    iconBg: "#fee8e8",
    iconFg: "#c02020",
    badgeBg: "#fee8e8",
    badgeFg: "#8b1010",
  },
  gold: {
    border: "var(--color-gold)",
    iconBg: "var(--color-gold-pale)",
    iconFg: "var(--color-gold)",
    badgeBg: "var(--color-gold-pale)",
    badgeFg: "#7a5000",
  },
};

function AnnouncementCard({ a }: { a: Announcement }) {
  const t = TONE[a.tone];
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderLeft: `3px solid ${t.border}`,
        borderRadius: "0 var(--radius-card) var(--radius-card) 0",
        padding: "12px 14px",
        marginBottom: 10,
        boxShadow: "0 1px 4px rgba(14,123,120,.04)",
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: t.iconBg,
          }}
        >
          <Icon name={a.icon} size={14} color={t.iconFg} />
        </div>
        <div>
          <div
            style={{
              display: "inline-flex",
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 10,
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: ".4px",
              background: t.badgeBg,
              color: t.badgeFg,
            }}
          >
            {a.badge}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-tx)" }}>
            {a.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-tx2)",
              lineHeight: 1.55,
              margin: "4px 0",
            }}
          >
            {a.body}
          </div>
          <div style={{ fontSize: 10, color: "var(--color-tx3)" }}>{a.meta}</div>
        </div>
      </div>
    </div>
  );
}

/* Map an ActionKind to a Button variant. */
function actionVariant(kind: string): ButtonVariant {
  switch (kind) {
    case "join":
      return "join";
    case "joined":
      return "joined";
    case "volunteer":
      return "vol";
    case "book":
      return "book";
    case "participant":
      return "part";
    default:
      return "ghost";
  }
}
