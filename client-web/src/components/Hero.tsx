"use client";

import { Icon } from "@/components/ui/Icon";
import { useModal } from "@/components/ModalHost";
import { HERO_STATS } from "@/lib/data";
import type { TabId } from "@/components/TabNav";

export function Hero({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { open } = useModal();

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,var(--color-teal-dark) 0%,var(--color-teal) 50%,#128a80 100%)",
        padding: "32px",
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 28,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        borderBottom: "3px solid var(--color-gold-light)",
      }}
    >
      {/* Glows + pattern */}
      <div style={glow(300, "rgba(232,101,10,.18)", { right: -60, top: -80 })} />
      <div style={glow(200, "rgba(196,136,10,.12)", { left: "35%", bottom: -60 })} />
      <div className="hero-pattern" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Left */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(240,192,64,.18)",
            border: "1px solid rgba(240,192,64,.4)",
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-gold-light)",
            marginBottom: 14,
          }}
        >
          <Icon name="ti-calendar-event" size={12} /> Ganesh Festival begins in 4 days &nbsp;🐘
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.25 }}>
          Good evening, Jay 👋
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,.72)",
            marginBottom: 20,
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          Welcome back to Green Acres Society. Here&apos;s what&apos;s happening in your community today.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <HeroBtn variant="saffron" onClick={() => onNavigate("events")}>
            <Icon name="ti-calendar-event" size={14} /> View all events
          </HeroBtn>
          <HeroBtn variant="ghost" onClick={() => onNavigate("my-activity")}>
            <Icon name="ti-clipboard-list" size={14} /> My activity
          </HeroBtn>
          <HeroBtn variant="ghost" onClick={() => open("vol")}>
            <Icon name="ti-heart-handshake" size={14} /> Volunteer
          </HeroBtn>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {HERO_STATS.slice(0, 2).map((s) => (
            <HeroStat key={s.lbl} {...s} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {HERO_STATS.slice(2).map((s) => (
            <HeroStat key={s.lbl} {...s} />
          ))}
        </div>
        <div
          onClick={() => onNavigate("events")}
          style={{
            background: "rgba(255,255,255,.1)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: "var(--radius-card)",
            padding: "13px 15px",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 20 }}>🐘</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Ganesh Festival 2026</div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="ti-calendar" size={11} /> 20–25 Sep · 6 days
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="ti-users" size={11} /> 126 joined
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="ti-list" size={11} /> 24 activities
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function glow(size: number, color: string, pos: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle,${color} 0%,transparent 70%)`,
    pointerEvents: "none",
    ...pos,
  };
}

function HeroStat({ num, lbl, sub }: { num: string; lbl: string; sub: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.1)",
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: "var(--radius-card)",
        padding: "14px 16px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: "var(--color-gold-light)" }}>
        {num}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.72)", marginTop: 4, fontWeight: 500 }}>
        {lbl}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function HeroBtn({
  variant,
  children,
  onClick,
}: {
  variant: "saffron" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    borderRadius: "var(--radius-s)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .2s",
    border: "none",
  };
  const variantStyle: React.CSSProperties =
    variant === "saffron"
      ? {
          background: "linear-gradient(135deg,var(--color-saffron),#f07820)",
          color: "#fff",
          boxShadow: "0 3px 12px rgba(232,101,10,.4)",
        }
      : {
          background: "rgba(255,255,255,.12)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,.28)",
        };
  return (
    <button style={{ ...base, ...variantStyle }} onClick={onClick}>
      {children}
    </button>
  );
}
