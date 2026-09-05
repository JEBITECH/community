"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card, CardHead, CardBody } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NotAvailable, LoadingRows } from "@/components/ui/NotAvailable";
import {
  useAnnouncements,
  useMembers,
  displayName,
} from "@/lib/hooks/useActivity";
import { humanize, initials } from "@/lib/utils/format";
import type { Announcement, DirectoryEntry } from "@/lib/api/types";

export function CommunityTab() {
  return (
    // Collapses to a single column below 64rem.
    <div className="u-split u-split--narrow">
      <div style={{ display: "grid", gap: "1.125rem" }}>
        <CommunicationsBox />
        <DirectoryBox />
      </div>

      <div style={{ display: "grid", gap: "1.125rem" }}>
        <AnnouncementsBox />
        <BirthdaysBox />
        <UrgentContactsBox />
      </div>
    </div>
  );
}

/* ─── 1. Communications ─── */

function CommunicationsBox() {
  return (
    <div>
      <SectionHeader icon="ti-speakerphone" title="Community conversations" />
      {/*
        Event discussion threads and per-event chat DO exist in community-svc
        (GET/POST /events/:id/comments and a Socket.io chat namespace), but a
        standalone community-wide feed does not. Rather than mislabel event
        comments as a community feed, this states what's missing.
      */}
      <NotAvailable
        title="Community-wide conversations aren't wired up yet"
        detail="community-svc has per-event discussion threads and live chat, but no organisation-level feed or announcements table. Those need backend work before this box can show real posts."
      />
    </div>
  );
}

/* ─── 2. Directory (real) ─── */

function DirectoryBox() {
  const members = useMembers();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (members.data ?? [])
      .filter((m) => {
        if (!needle) return true;
        return (
          displayName(m).toLowerCase().includes(needle) ||
          (m.unit_identifier ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }, [members.data, search]);

  return (
    <Card>
      <CardHead
        icon="ti-users"
        title={`Neighbours${members.data ? ` · ${members.data.length}` : ""}`}
        right={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or flat"
            aria-label="Search neighbours"
            style={{
              width: "9.375rem",
              height: "1.625rem",
              padding: "0 0.5625rem",
              fontSize: "var(--text-xs)",
              fontFamily: "inherit",
              color: "var(--color-tx)",
              background: "#fff",
              border: "1px solid var(--color-bdr2)",
              borderRadius: "1.25rem",
              outline: "none",
            }}
          />
        }
      />
      <CardBody flush style={{ paddingBottom: "0.75rem" }}>
        {members.isLoading ? (
          <div style={{ padding: "0.75rem 0" }}>
            <LoadingRows rows={3} />
          </div>
        ) : visible.length === 0 ? (
          <div
            style={{
              padding: "1.125rem 0",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-tx3)",
            }}
          >
            {search
              ? "No matches."
              : "No members have made themselves visible yet."}
          </div>
        ) : (
          visible.map((m) => <MemberRow key={m.membership_id} member={m} />)
        )}
      </CardBody>
    </Card>
  );
}

function MemberRow({ member }: { member: DirectoryEntry }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--color-bdr)",
      }}
    >
      <span
        style={{
          width: "1.875rem",
          height: "1.875rem",
          flexShrink: 0,
          borderRadius: "50%",
          background: "var(--color-teal-light)",
          color: "var(--color-teal-dark)",
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          display: "grid",
          placeItems: "center",
        }}
      >
        {initials(member.first_name, member.last_name)}
      </span>
      <div style={{ minWidth: "0rem", flex: 1 }}>
        <div
          style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-tx)" }}
        >
          {displayName(member)}
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-tx3)", marginTop: "0.0625rem" }}>
          {member.unit_identifier || humanize(member.role)}
        </div>
      </div>
      {member.member_type === "external" && (
        <span
          style={{
            flexShrink: 0,
            fontSize: "var(--text-2xs)",
            fontWeight: 600,
            padding: "0.125rem 0.4375rem",
            borderRadius: "0.625rem",
            background: "var(--color-part-bg)",
            color: "var(--color-part-tx)",
          }}
        >
          Guest
        </span>
      )}
    </div>
  );
}

/* ─── 3. Announcements (real) ─── */

const ANNOUNCEMENTS_PREVIEW = 2;

function AnnouncementsBox() {
  const announcements = useAnnouncements();
  const notices = announcements.data ?? [];

  const [showAll, setShowAll] = useState(false);
  const hasMore = notices.length > ANNOUNCEMENTS_PREVIEW;
  const visible =
    showAll || !hasMore ? notices : notices.slice(0, ANNOUNCEMENTS_PREVIEW);

  return (
    <Card>
      <CardHead
        icon="ti-speakerphone"
        title={`Announcements${notices.length ? ` · ${notices.length}` : ""}`}
      />
      <CardBody flush style={{ paddingBottom: hasMore ? "0.5rem" : "0.75rem" }}>
        {announcements.isLoading ? (
          <div style={{ padding: "0.75rem 0" }}>
            <LoadingRows rows={2} />
          </div>
        ) : notices.length === 0 ? (
          <div
            style={{
              padding: "1rem 0",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-tx3)",
            }}
          >
            No announcements right now.
          </div>
        ) : (
          <>
            {/*
              Show only the first couple by default; expanding reveals the rest
              inside a height-capped scroll area so a long list can't stretch
              the card down the page.
            */}
            <div
              style={
                showAll
                  ? { maxHeight: "22rem", overflowY: "auto" }
                  : undefined
              }
            >
              {visible.map((a, i) => (
                <AnnouncementRow
                  key={a.id}
                  announcement={a}
                  last={i === visible.length - 1}
                />
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  width: "100%",
                  marginTop: "0.5rem",
                  minHeight: "var(--tap)",
                  padding: "0.375rem 0.5rem",
                  background: "none",
                  border: "none",
                  color: "var(--color-teal)",
                  fontFamily: "inherit",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showAll
                  ? "Show less"
                  : `View ${notices.length - ANNOUNCEMENTS_PREVIEW} more`}
                <Icon
                  name={showAll ? "ti-chevron-up" : "ti-chevron-down"}
                  size={13}
                />
              </button>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

/** Compact one-glance row: dot + title, body clamped to two lines. */
function AnnouncementRow({
  announcement: a,
  last,
}: {
  announcement: Announcement;
  last?: boolean;
}) {
  const accent =
    a.priority === "urgent"
      ? "var(--color-danger-tx)"
      : a.priority === "important"
        ? "var(--color-saffron)"
        : "var(--color-teal)";

  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        padding: "0.5rem 0",
        borderBottom: last ? "none" : "1px solid var(--color-bdr)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          marginTop: "0.375rem",
          width: "0.5rem",
          height: "0.5rem",
          flexShrink: 0,
          borderRadius: "50%",
          background: accent,
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          {a.is_pinned && <Icon name="ti-pin" size={12} color={accent} />}
          <span
            className="u-min0"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-tx)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {a.title}
          </span>
        </div>
        <p
          style={{
            margin: "0.125rem 0 0",
            fontSize: "var(--text-2xs)",
            color: "var(--color-tx3)",
            lineHeight: 1.45,
            // Clamp the body to two lines so the card stays an overview.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {a.body}
        </p>
      </div>
    </div>
  );
}

/* ─── 4. Birthdays ─── */

function BirthdaysBox() {
  return (
    <Card>
      <CardHead icon="ti-cake" title="Birthdays" />
      <CardBody>
        {/*
          Users DO have a `dob` column, but GET /members returns a projection
          that omits it and there's no upcoming-birthdays endpoint, so the data
          simply isn't reachable from here yet.
        */}
        <NotAvailable
          title="Birthdays aren't available yet"
          detail="Members have a date of birth on file, but the directory endpoint doesn't return it. A small backend change would light this up."
        />
      </CardBody>
    </Card>
  );
}

/* ─── 5. Urgent contacts ─── */

function UrgentContactsBox() {
  return (
    <Card>
      <CardHead icon="ti-alert-triangle" title="Urgent contacts" />
      <CardBody>
        <NotAvailable
          title="Emergency contacts aren't stored yet"
          detail="There's no emergency-contacts table in the backend. Once added, security, plumber and society office numbers can live here."
        />
      </CardBody>
    </Card>
  );
}
