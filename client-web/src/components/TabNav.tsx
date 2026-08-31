"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { categorize, usePublishedEvents } from "@/lib/hooks/useEvents";
import {
  useMyParticipations,
  useMyVolunteering,
} from "@/lib/hooks/useActivity";

export type TabId = "events" | "my-activity" | "community";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "events", icon: "ti-calendar-event", label: "Events" },
  { id: "my-activity", icon: "ti-clipboard-list", label: "My activity" },
  { id: "community", icon: "ti-users", label: "Community" },
];

/**
 * Primary tab bar.
 *
 * Scrolls horizontally rather than letting three tabs collide with each other
 * once the text scales up, and releases its sticky position on short/narrow
 * viewports (see `.u-sticky`) so it and the header can't between them swallow
 * the visible area at 200%+ zoom.
 */
export function TabNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  const events = usePublishedEvents();
  const participations = useMyParticipations();
  const volunteering = useMyVolunteering();

  const badges = useMemo<Partial<Record<TabId, number>>>(() => {
    const { live, upcoming } = categorize(events.data ?? []);
    const activeCount = (participations.data ?? []).filter(
      (p) => p.status === "active",
    ).length;
    const volunteerCount = (volunteering.data ?? []).filter(
      (v) => v.approval_status !== "rejected",
    ).length;

    return {
      events: live.length + upcoming.length,
      "my-activity": activeCount + volunteerCount,
    };
  }, [events.data, participations.data, volunteering.data]);

  return (
    <nav
      aria-label="Sections"
      className="u-sticky"
      style={{
        top: "3.9375rem",
        background: "var(--color-ivory-dark)",
        borderBottom: "1px solid var(--color-bdr2)",
      }}
    >
      <div className="u-container" style={{ paddingInline: 0 }}>
        <div
          className="u-scroll-x u-container"
          role="tablist"
          style={{ paddingBlock: 0 }}
        >
          {TABS.map((t) => {
            const isActive = t.id === active;
            const badge = badges[t.id];

            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.id)}
                style={{
                  flexShrink: 0,
                  minHeight: "var(--tap)",
                  padding: "0.75rem 1.125rem",
                  fontSize: "var(--text-xs)",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--color-teal)" : "var(--color-tx3)",
                  cursor: "pointer",
                  borderBottom: `0.1875rem solid ${
                    isActive ? "var(--color-teal)" : "transparent"
                  }`,
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  background: "none",
                  fontFamily: "inherit",
                }}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
                {badge !== undefined && badge > 0 && (
                  <span
                    style={{
                      background: "var(--color-saffron)",
                      color: "#fff",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "var(--text-2xs)",
                      fontWeight: 700,
                      padding: "0.0625rem 0.375rem",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/** Pill-style sub-tabs used within a tab pane. */
export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; icon: string; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      className="u-row"
      role="tablist"
      style={{ marginBottom: "var(--space-4)", gap: "var(--space-2)" }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            style={{
              minHeight: "var(--tap)",
              padding: "0.4375rem 0.875rem",
              borderRadius: "var(--radius-pill)",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              cursor: "pointer",
              border: `0.09375rem solid ${
                isActive ? "var(--color-teal)" : "var(--color-bdr2)"
              }`,
              background: isActive ? "var(--color-teal)" : "#fff",
              color: isActive ? "#fff" : "var(--color-tx2)",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              lineHeight: 1.3,
            }}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
