"use client";

import { Icon } from "@/components/ui/Icon";

export type TabId = "events" | "my-activity" | "community";

const TABS: { id: TabId; icon: string; label: string; badge?: string }[] = [
  { id: "events", icon: "ti-calendar-event", label: "Events", badge: "8" },
  { id: "my-activity", icon: "ti-clipboard-list", label: "My activity", badge: "4" },
  { id: "community", icon: "ti-users", label: "Community" },
];

export function TabNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-ivory-dark)",
        borderBottom: "1px solid var(--color-bdr2)",
        padding: "0 32px",
        display: "flex",
        position: "sticky",
        top: 63,
        zIndex: 90,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "13px 22px",
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--color-teal)" : "var(--color-tx3)",
              cursor: "pointer",
              borderBottom: `3px solid ${isActive ? "var(--color-teal)" : "transparent"}`,
              borderLeft: "none",
              borderRight: "none",
              borderTop: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              background: "none",
              fontFamily: "inherit",
              transition: "all .18s",
            }}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
            {t.badge && (
              <span
                style={{
                  background: "var(--color-saffron)",
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  marginLeft: 3,
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
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
    <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              border: `1.5px solid ${isActive ? "var(--color-teal)" : "var(--color-bdr)"}`,
              background: isActive ? "var(--color-teal)" : "#fff",
              color: isActive ? "#fff" : "var(--color-tx2)",
              fontFamily: "inherit",
              transition: "all .18s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name={t.icon} size={12} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
