"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card, CardHead, CardBody } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NotAvailable, LoadingRows } from "@/components/ui/NotAvailable";
import { useMembers, displayName } from "@/lib/hooks/useActivity";
import { humanize, initials } from "@/lib/utils/format";
import type { DirectoryEntry } from "@/lib/api/types";

/** Roles that make up the organising committee. */
const COMMITTEE_ROLES = new Set(["super_admin", "core_committee", "master_admin"]);

export function CommunityTab() {
  return (
    // Collapses to a single column below 64rem.
    <div className="u-split u-split--narrow">
      <div style={{ display: "grid", gap: "1.125rem" }}>
        <CommunicationsBox />
        <DirectoryBox />
      </div>

      <div style={{ display: "grid", gap: "1.125rem" }}>
        <CommitteeBox />
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

/* ─── 3. Committee (real) ─── */

function CommitteeBox() {
  const members = useMembers();

  // Derived from membership roles -- there's no dedicated committee endpoint,
  // but the directory already exposes each member's role.
  const committee = useMemo(
    () => (members.data ?? []).filter((m) => COMMITTEE_ROLES.has(m.role)),
    [members.data],
  );

  return (
    <Card>
      <CardHead icon="ti-award" title="Committee" />
      <CardBody flush style={{ paddingBottom: "0.75rem" }}>
        {members.isLoading ? (
          <div style={{ padding: "0.75rem 0" }}>
            <LoadingRows rows={2} />
          </div>
        ) : committee.length === 0 ? (
          <div
            style={{
              padding: "1rem 0",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-tx3)",
            }}
          >
            No committee members are listed in the directory.
          </div>
        ) : (
          committee.map((m) => (
            <div
              key={m.membership_id}
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
                  background: "var(--color-gold-pale)",
                  color: "var(--color-gold)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {initials(m.first_name, m.last_name)}
              </span>
              <div style={{ minWidth: "0rem", flex: 1 }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--color-tx)",
                  }}
                >
                  {displayName(m)}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--color-teal)",
                    marginTop: "0.0625rem",
                    fontWeight: 500,
                  }}
                >
                  {humanize(m.role)}
                  {m.unit_identifier ? ` · ${m.unit_identifier}` : ""}
                </div>
              </div>
            </div>
          ))
        )}
        <p
          style={{
            margin: "0.625rem 0 0",
            fontSize: "var(--text-2xs)",
            lineHeight: 1.5,
            color: "var(--color-tx3)",
          }}
        >
          Contact details are only shared with committee members.
        </p>
      </CardBody>
    </Card>
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
