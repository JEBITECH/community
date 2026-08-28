"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Card, CardHead, CardBody } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubTabs } from "@/components/TabNav";
import { useModal } from "@/components/ModalHost";
import { BIRTHDAYS, COMMITTEE, DISCUSSIONS, FEED } from "@/lib/data";
import type { Discussion } from "@/lib/types";

type CommunitySubTab = "discussions" | "birthdays" | "feed";

const SUB_TABS: { id: CommunitySubTab; icon: string; label: string }[] = [
  { id: "discussions", icon: "ti-messages", label: "Discussions" },
  { id: "birthdays", icon: "ti-cake", label: "Birthdays" },
  { id: "feed", icon: "ti-activity", label: "Community feed" },
];

export function CommunityTab() {
  const [sub, setSub] = useState<CommunitySubTab>("discussions");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 22,
        alignItems: "start",
      }}
    >
      <div>
        <SubTabs tabs={SUB_TABS} active={sub} onChange={setSub} />
        {sub === "discussions" && <DiscussionsView />}
        {sub === "birthdays" && <BirthdaysView />}
        {sub === "feed" && <FeedView />}
      </div>
      <CommunitySidebar />
    </div>
  );
}

/* ─── Discussions ─── */
function DiscussionsView() {
  return (
    <>
      <SectionHeader
        icon="ti-messages"
        title="Community conversations"
        right={
          <Button variant="saffron" size="sm">
            <Icon name="ti-plus" size={12} /> New post
          </Button>
        }
      />
      {DISCUSSIONS.map((d) => (
        <DiscussionCard key={d.id} d={d} />
      ))}
    </>
  );
}

function DiscussionCard({ d }: { d: Discussion }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        padding: 14,
        marginBottom: 10,
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(14,123,120,.04)",
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            background: d.avatarGradient,
          }}
        >
          {d.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-tx)" }}>{d.name}</div>
          <div style={{ fontSize: 10, color: "var(--color-tx3)" }}>{d.when}</div>
        </div>
        <Tag tone={d.tagKind}>{d.tagLabel}</Tag>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tx)", marginBottom: 4 }}>
        {d.title}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-tx2)", lineHeight: 1.6 }}>{d.preview}</div>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid var(--color-bdr)",
        }}
      >
        <Stat icon="ti-heart" color="var(--color-saffron)" label={d.likes} />
        <Stat icon="ti-message" label={d.comments} />
        {d.follow && <Stat icon="ti-bookmark" color="var(--color-teal)" label="Follow" />}
      </div>
    </div>
  );
}

function Stat({ icon, color, label }: { icon: string; color?: string; label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        color: "var(--color-tx3)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Icon name={icon} size={13} color={color} />
      {label}
    </span>
  );
}

/* ─── Birthdays ─── */
function BirthdaysView() {
  const { open } = useModal();
  const [when, setWhen] = useState<"today" | "tomorrow" | "week">("today");

  return (
    <>
      <SectionHeader
        icon="ti-cake"
        title="Birthdays"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant={when === "today" ? "teal" : "ghost"} size="sm" onClick={() => setWhen("today")}>
              Today
            </Button>
            <Button variant={when === "tomorrow" ? "teal" : "ghost"} size="sm" onClick={() => setWhen("tomorrow")}>
              Tomorrow
            </Button>
            <Button variant={when === "week" ? "teal" : "ghost"} size="sm" onClick={() => setWhen("week")}>
              This week
            </Button>
          </div>
        }
      />
      <Card>
        <CardBody flush>
          {BIRTHDAYS.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "9px 0",
                borderBottom: i === BIRTHDAYS.length - 1 ? "none" : "1px solid var(--color-bdr)",
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
                  background: b.avatarGradient,
                }}
              >
                {b.initials}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 12, fontWeight: 500, color: "var(--color-tx)", margin: 0 }}>
                  {b.name}
                </h4>
                <p style={{ fontSize: 10, color: "var(--color-tx3)", margin: 0 }}>{b.detail}</p>
              </div>
              {b.today ? (
                <Button variant="join" size="sm" onClick={() => open("wish")}>
                  <Icon name="ti-confetti" size={11} /> Send wish
                </Button>
              ) : (
                <Button variant="ghost" size="sm">
                  Remind me
                </Button>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}

/* ─── Feed ─── */
function FeedView() {
  return (
    <>
      <SectionHeader icon="ti-activity" title="Community feed" />
      <Card>
        <CardBody flush>
          {FEED.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                gap: 10,
                padding: "8px 0",
                borderBottom: i === FEED.length - 1 ? "none" : "1px solid var(--color-bdr)",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 5,
                  background: f.dotColor,
                }}
              />
              <div>
                <div style={{ fontSize: 12, color: "var(--color-tx)", lineHeight: 1.5 }}>{f.text}</div>
                <div style={{ fontSize: 10, color: "var(--color-tx3)", marginTop: 2 }}>{f.time}</div>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}

/* ─── Sidebar ─── */
function CommunitySidebar() {
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <CardHead icon="ti-home" title="About Green Acres Society" />
        <CardBody style={{ fontSize: 12, color: "var(--color-tx2)", lineHeight: 1.65 }}>
          Green Acres Society brings 75 families together through celebrations, sports and cultural events.
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <ContactRow icon="ti-map-pin" text="Sector 12, Green Acres, Pune" />
            <ContactRow icon="ti-phone" text="+91 98765 00000" />
            <ContactRow icon="ti-mail" text="office@greenacressociety.in" />
          </div>
        </CardBody>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <CardHead icon="ti-award" title="Committee" />
        <CardBody flush>
          {COMMITTEE.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "9px 0",
                borderBottom: i === COMMITTEE.length - 1 ? "none" : "1px solid var(--color-bdr)",
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
                  background: p.avatarGradient,
                }}
              >
                {p.initials}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 12, fontWeight: 500, color: "var(--color-tx)", margin: 0 }}>
                  {p.name}
                </h4>
                <p style={{ fontSize: 10, color: "var(--color-tx3)", margin: 0 }}>{p.role}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHead icon="ti-alert-triangle" title="Emergency contacts" />
        <CardBody style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <Button variant="danger" full>
            <Icon name="ti-ambulance" size={14} /> Ambulance — 108
          </Button>
          <Button variant="ghost" full>
            <Icon name="ti-shield" size={14} color="var(--color-teal)" /> Security guard on duty
          </Button>
          <Button variant="ghost" full>
            <Icon name="ti-stethoscope" size={14} color="var(--color-teal)" /> Dr. Mehta — C-8
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function ContactRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Icon name={icon} size={14} color="var(--color-teal)" />
      <span>{text}</span>
    </div>
  );
}
