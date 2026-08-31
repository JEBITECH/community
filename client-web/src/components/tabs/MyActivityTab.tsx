"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Card, CardHead, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { NotAvailable, LoadingRows } from "@/components/ui/NotAvailable";
import { useModal } from "@/components/ModalHost";
import { usePublishedEvents } from "@/lib/hooks/useEvents";
import {
  useMyDonations,
  useMyParticipations,
  useMySponsorships,
  useMyVolunteering,
} from "@/lib/hooks/useActivity";
import {
  formatDate,
  formatMoney,
  parseDateOnly,
  toNumber,
} from "@/lib/utils/format";

type ScheduleFilter = "all" | "joined" | "book" | "volunteer";

/** One normalised row, whatever kind of commitment it came from. */
interface ActivityRow {
  id: string;
  /** Sort/group key: the underlying record's creation date. */
  when: string;
  eventName: string;
  title: string;
  kind: "joined" | "book" | "volunteer";
  status: string;
  /** Present only where the resident can still withdraw. */
  participationId?: string;
  amount?: number;
}

export function MyActivityTab() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const { open } = useModal();

  const participations = useMyParticipations();
  const donations = useMyDonations();
  const sponsorships = useMySponsorships();
  const volunteering = useMyVolunteering();
  const events = usePublishedEvents();

  // Participations carry no event name, so resolve it from the events list.
  const eventNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of events.data ?? []) map.set(e.id, e.name);
    return map;
  }, [events.data]);

  const loading =
    participations.isLoading ||
    donations.isLoading ||
    sponsorships.isLoading ||
    volunteering.isLoading;

  /**
   * Everything from a year back to a year ahead, per spec — the "me" endpoints
   * return the member's whole history unfiltered.
   */
  const rows = useMemo<ActivityRow[]>(() => {
    const from = shiftYears(-1);
    const to = shiftYears(1);
    const out: ActivityRow[] = [];

    for (const p of participations.data ?? []) {
      // Donations and sponsorships are surfaced from their own richer records.
      if (p.type === "donate" || p.type === "sponsor") continue;

      out.push({
        id: p.id,
        when: p.createdAt,
        eventName: eventNames.get(p.event_id) ?? "Event",
        title:
          p.type === "book"
            ? "Booked activity"
            : p.event_component_id
              ? "Joined activity"
              : "Attending event",
        kind: p.type === "book" ? "book" : "joined",
        status: p.status,
        participationId: p.status === "active" ? p.id : undefined,
      });
    }

    for (const v of volunteering.data ?? []) {
      out.push({
        id: v.id,
        when: v.createdAt,
        eventName: v.event_name,
        title: v.role_title,
        kind: "volunteer",
        status: v.approval_status,
      });
    }

    return out
      .filter((r) => r.when >= from && r.when <= to)
      .sort((a, b) => b.when.localeCompare(a.when));
  }, [participations.data, volunteering.data, eventNames]);

  const visible =
    filter === "all" ? rows : rows.filter((r) => r.kind === filter);

  const grouped = useMemo(() => groupByMonth(visible), [visible]);

  // Counts. "Joined" and "Booked" are distinct participation types; the spec
  // also asks for "Participated", which the backend cannot distinguish from
  // "Joined" (both are type 'join'), so that tile is omitted rather than faked.
  const joinedCount = rows.filter((r) => r.kind === "joined").length;
  const bookedCount = rows.filter((r) => r.kind === "book").length;
  const volunteerCount = rows.filter((r) => r.kind === "volunteer").length;

  const givenTotal =
    (donations.data ?? []).reduce((s, d) => s + toNumber(d.amount), 0) +
    (sponsorships.data ?? []).reduce((s, x) => s + toNumber(x.amount_pledged), 0);

  return (
    <>
      {/* Stats — the browser picks the column count, so 4 tiles become 2 then 1. */}
      <div
        className="u-autogrid"
        style={{ marginBottom: "var(--space-5)" }}
      >
        <StatTile
          n={joinedCount}
          label="Activities joined"
          color="var(--color-join-tx)"
          top="var(--color-saffron)"
        />
        <StatTile
          n={bookedCount}
          label="Activities booked"
          color="var(--color-book-tx)"
          top="var(--color-gold)"
        />
        <StatTile
          n={volunteerCount}
          label="Volunteering"
          color="var(--color-vol-tx)"
          top="var(--color-teal)"
        />
        <StatTile
          n={formatMoney(givenTotal)}
          label="Contributed"
          color="var(--color-done-tx)"
          top="#50b888"
        />
      </div>

      <div className="u-split u-split--narrow">
        {/* Schedule */}
        <Card>
          <CardHead
            icon="ti-calendar-check"
            title="Your activity"
            right={
              <div style={{ display: "flex", gap: "0.375rem" }}>
                <FilterBtn
                  label="All"
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                <FilterBtn
                  label="Joined"
                  active={filter === "joined"}
                  onClick={() => setFilter("joined")}
                />
                <FilterBtn
                  label="Booked"
                  active={filter === "book"}
                  onClick={() => setFilter("book")}
                />
                <FilterBtn
                  label="Volunteering"
                  active={filter === "volunteer"}
                  onClick={() => setFilter("volunteer")}
                />
              </div>
            }
          />
          <CardBody flush style={{ paddingBottom: "0.625rem" }}>
            {loading && (
              <div style={{ padding: "0.875rem 0" }}>
                <LoadingRows rows={3} />
              </div>
            )}

            {!loading && grouped.length === 0 && (
              <div
                style={{
                  padding: "1.5rem 0",
                  textAlign: "center",
                  color: "var(--color-tx3)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {rows.length === 0
                  ? "You haven't joined anything yet. Head to Events to get started."
                  : "Nothing here for this filter."}
              </div>
            )}

            {grouped.map((group) => (
              <div key={group.label} style={{ margin: "0.75rem 0 0.875rem" }}>
                <div
                  style={{
                    fontSize: "var(--text-2xs)",
                    fontWeight: 600,
                    color: "var(--color-teal)",
                    textTransform: "uppercase",
                    letterSpacing: ".6px",
                    marginBottom: "0.625rem",
                    paddingBottom: "0.375rem",
                    borderBottom: "1px solid var(--color-bdr)",
                  }}
                >
                  {group.label}
                </div>

                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="u-activity-row"
                    style={{
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-bdr)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: "var(--color-saffron)",
                        paddingTop: "0.125rem",
                      }}
                    >
                      {formatDate(item.when.slice(0, 10))}
                    </div>

                    <div style={{ minWidth: "0rem" }}>
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          color: "var(--color-tx)",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-tx3)",
                          marginTop: "0.125rem",
                        }}
                      >
                        {item.eventName}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <StatusPill kind={pillKind(item)}>
                        {pillLabel(item)}
                      </StatusPill>
                      {item.participationId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            open({
                              kind: "cancel",
                              participationId: item.participationId!,
                              label: item.title,
                            })
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Right column */}
        <div style={{ display: "grid", gap: "1rem" }}>
          <Card>
            <CardHead icon="ti-users" title="Family members" />
            <CardBody>
              {/*
                The backend has no household/family concept -- only a per-member
                `unit_identifier` string. Grouping by flat would silently miss
                anyone who hid themselves from the directory, so this states the
                gap instead.
              */}
              <NotAvailable
                title="Family grouping isn't available yet"
                detail="Members are linked to a flat number, but there's no household model to group them or add relatives. Needs backend support."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead icon="ti-receipt" title="Contributions" />
            <CardBody flush style={{ paddingBottom: "0.75rem" }}>
              <ContributionList />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function ContributionList() {
  const donations = useMyDonations();
  const sponsorships = useMySponsorships();

  const rows = [
    ...(donations.data ?? []).map((d) => ({
      id: d.id,
      label: d.event_name,
      sub: d.receipt_number ?? "Donation",
      amount: toNumber(d.amount),
      status: d.payment_status,
    })),
    ...(sponsorships.data ?? []).map((s) => ({
      id: s.id,
      label: s.event_name,
      sub: s.receipt_number ?? "Sponsorship",
      amount: toNumber(s.amount_pledged),
      status: s.payment_status,
    })),
  ];

  if (donations.isLoading || sponsorships.isLoading) {
    return (
      <div style={{ padding: "0.625rem 0" }}>
        <LoadingRows rows={2} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "1rem 0",
          textAlign: "center",
          fontSize: "var(--text-sm)",
          color: "var(--color-tx3)",
        }}
      >
        No contributions yet.
      </div>
    );
  }

  return (
    <>
      {rows.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.625rem",
            padding: "0.5625rem 0",
            borderBottom: "1px solid var(--color-bdr)",
          }}
        >
          <div style={{ minWidth: "0rem" }}>
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--color-tx)",
              }}
            >
              {r.label}
            </div>
            <div
              style={{ fontSize: "var(--text-2xs)", color: "var(--color-tx3)", marginTop: "0.125rem" }}
            >
              {r.sub}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                color: "var(--color-tx)",
              }}
            >
              {formatMoney(r.amount)}
            </div>
            <div
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".04em",
                marginTop: "0.125rem",
                color:
                  r.status === "recorded"
                    ? "var(--color-done-tx)"
                    : r.status === "failed"
                      ? "#8b1010"
                      : "var(--color-book-tx)",
              }}
            >
              {r.status === "recorded" ? "Paid" : r.status}
            </div>
          </div>
        </div>
      ))}
      <p
        style={{
          margin: "0.625rem 0 0",
          fontSize: "var(--text-2xs)",
          lineHeight: 1.5,
          color: "var(--color-tx3)",
        }}
      >
        Payments are collected by the committee and marked paid once received.
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------

function StatTile({
  n,
  label,
  color,
  top,
}: {
  n: number | string;
  label: string;
  color: string;
  top: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        padding: "0.875rem",
        textAlign: "center",
        borderTop: `3px solid ${top}`,
        boxShadow: "0 1px 4px rgba(14,123,120,.06)",
      }}
    >
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color }}>{n}</div>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          color: "var(--color-tx3)",
          marginTop: "0.1875rem",
          textTransform: "uppercase",
          letterSpacing: ".4px",
        }}
      >
        {label}
      </div>
    </div>
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
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.1875rem 0.5625rem",
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        fontFamily: "inherit",
        borderRadius: "1.25rem",
        cursor: "pointer",
        border: `1px solid ${active ? "var(--color-teal)" : "var(--color-bdr)"}`,
        background: active ? "var(--color-teal)" : "#fff",
        color: active ? "#fff" : "var(--color-tx3)",
      }}
    >
      {label}
    </button>
  );
}

function pillKind(
  row: ActivityRow,
): "joined" | "book" | "volunteer" | "participant" {
  if (row.kind === "volunteer") return "volunteer";
  if (row.kind === "book") return "book";
  return row.status === "attended" ? "participant" : "joined";
}

function pillLabel(row: ActivityRow): string {
  if (row.kind === "volunteer") {
    return row.status === "approved"
      ? "Approved"
      : row.status === "rejected"
        ? "Declined"
        : "Pending";
  }
  if (row.status === "cancelled") return "Cancelled";
  if (row.status === "attended") return "Attended";
  return row.kind === "book" ? "Booked" : "Joined";
}

/** ISO timestamp `years` from now, for the activity date window. */
function shiftYears(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

function groupByMonth(rows: ActivityRow[]) {
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  });

  const map = new Map<string, ActivityRow[]>();
  for (const row of rows) {
    const key = monthLabel.format(parseDateOnly(row.when.slice(0, 10)));
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }

  return Array.from(map, ([label, items]) => ({ label, items }));
}
