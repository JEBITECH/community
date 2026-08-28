"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Card, CardHead, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { useModal } from "@/components/ModalHost";
import { FAMILY_ACTIVITY, MY_SCHEDULE, MY_STATS } from "@/lib/data";

type ScheduleFilter = "all" | "joined" | "book" | "volunteer";

export function MyActivityTab() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const { open } = useModal();

  const filtered = MY_SCHEDULE.map((group) => ({
    ...group,
    items:
      filter === "all"
        ? group.items
        : group.items.filter((i) => i.status.kind === filter),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {MY_STATS.map((s) => (
          <div
            key={s.l}
            style={{
              background: "#fff",
              border: "1px solid var(--color-bdr)",
              borderRadius: "var(--radius-card)",
              padding: 14,
              textAlign: "center",
              borderTop: `3px solid ${s.top}`,
              boxShadow: "0 1px 4px rgba(14,123,120,.06)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.n}</div>
            <div
              style={{
                fontSize: 10,
                color: "var(--color-tx3)",
                marginTop: 3,
                textTransform: "uppercase",
                letterSpacing: ".4px",
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 22,
          alignItems: "start",
        }}
      >
        {/* Schedule */}
        <Card>
          <CardHead
            icon="ti-calendar-check"
            title="Your schedule"
            right={
              <div style={{ display: "flex", gap: 6 }}>
                <FilterBtn label="All" active={filter === "all"} onClick={() => setFilter("all")} />
                <FilterBtn label="Joined" active={filter === "joined"} onClick={() => setFilter("joined")} />
                <FilterBtn label="Booked" active={filter === "book"} onClick={() => setFilter("book")} />
                <FilterBtn label="Volunteering" active={filter === "volunteer"} onClick={() => setFilter("volunteer")} />
              </div>
            }
          />
          <CardBody flush style={{ paddingBottom: 10 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--color-tx3)", fontSize: 12 }}>
                Nothing here for this filter.
              </div>
            )}
            {filtered.map((group) => (
              <div key={group.label} style={{ margin: "12px 0 14px" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-teal)",
                    textTransform: "uppercase",
                    letterSpacing: ".6px",
                    marginBottom: 10,
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--color-bdr)",
                  }}
                >
                  {group.label}
                </div>
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "64px 1fr auto",
                      gap: 10,
                      alignItems: "start",
                      padding: "10px 0",
                      borderBottom:
                        idx === group.items.length - 1 ? "none" : "1px solid var(--color-bdr)",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--color-saffron)",
                        paddingTop: 2,
                      }}
                    >
                      {item.time}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 500, color: "var(--color-tx)", margin: 0 }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: 10, color: "var(--color-tx3)", marginTop: 2 }}>
                        {item.event}
                      </div>
                      {item.ref && (
                        <div style={{ fontSize: 10, color: "var(--color-tx3)", marginTop: 2 }}>
                          {item.ref}
                        </div>
                      )}
                      <StatusPill kind={item.status.kind} icon={item.status.icon}>
                        {item.status.label}
                      </StatusPill>
                    </div>
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Sidebar */}
        <div>
          <Card style={{ marginBottom: 14 }}>
            <CardHead icon="ti-users" title="Family activity" />
            <CardBody flush>
              {FAMILY_ACTIVITY.map((f, i) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom:
                      i === FAMILY_ACTIVITY.length - 1 ? "none" : "1px solid var(--color-bdr)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                      background: f.gradient,
                    }}
                  >
                    {f.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 500, color: "var(--color-tx)", margin: 0 }}>
                      {f.name}
                    </h4>
                    <p style={{ fontSize: 10, color: "var(--color-tx3)", margin: 0 }}>{f.detail}</p>
                  </div>
                  <StatusPill kind={f.pill.kind === "vol" ? "volunteer" : "participant"}>
                    {f.pill.label}
                  </StatusPill>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHead icon="ti-bolt" title="Quick actions" />
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <Button variant="ghost" full onClick={() => open("join")}>
                  <Icon name="ti-plus" size={14} color="var(--color-saffron)" /> Join an activity
                </Button>
                <Button variant="ghost" full onClick={() => open("vol")}>
                  <Icon name="ti-heart-handshake" size={14} color="var(--color-teal)" /> Find volunteer spots
                </Button>
                <Button variant="ghost" full onClick={() => open("book")}>
                  <Icon name="ti-ticket" size={14} color="var(--color-gold)" /> Book a paid activity
                </Button>
                <Button variant="ghost" full>
                  <Icon name="ti-calendar-plus" size={14} color="var(--color-teal)" /> Add all to calendar
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? "teal" : "ghost"} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}
