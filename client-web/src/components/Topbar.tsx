"use client";

import { Icon } from "@/components/ui/Icon";

export function Topbar() {
  return (
    <div
      style={{
        height: 58,
        background:
          "linear-gradient(135deg,var(--color-teal-dark) 0%,var(--color-teal) 100%)",
        borderBottom: "2px solid var(--color-gold-light)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "sticky",
        top: 5,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            background: "linear-gradient(135deg,var(--color-gold-light),var(--color-gold))",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            border: "1.5px solid rgba(255,255,255,.3)",
            boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          }}
        >
          🕉️
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: ".1px" }}>
            Green Acres Society
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)", marginTop: 1 }}>
            Together we celebrate, participate and connect
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.2)", flexShrink: 0 }} />

      {/* Search */}
      <div
        style={{
          flex: 1,
          maxWidth: 380,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,.12)",
          border: "1px solid rgba(255,255,255,.22)",
          borderRadius: "var(--radius-s)",
          padding: "6px 12px",
        }}
      >
        <Icon name="ti-search" size={15} color="rgba(255,255,255,.45)" />
        <input
          placeholder="Search events, activities, members..."
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 13,
            color: "#fff",
            flex: 1,
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Right */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <TbIcon icon="ti-alert-triangle" color="#f0a060" title="Emergency" />
        <TbIcon icon="ti-bell" dot title="Notifications" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px 5px 5px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,.25)",
            cursor: "pointer",
            background: "rgba(255,255,255,.12)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg,var(--color-gold-light),var(--color-saffron))",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            J
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.9)" }}>
            Jay Shah &nbsp;·&nbsp; A-101
          </span>
          <Icon name="ti-chevron-down" size={13} color="rgba(255,255,255,.5)" />
        </div>
      </div>
    </div>
  );
}

function TbIcon({
  icon,
  color,
  dot,
  title,
}: {
  icon: string;
  color?: string;
  dot?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      style={{
        width: 34,
        height: 34,
        borderRadius: "var(--radius-s)",
        background: "rgba(255,255,255,.12)",
        border: "1px solid rgba(255,255,255,.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: color || "rgba(255,255,255,.85)",
        position: "relative",
      }}
    >
      <Icon name={icon} size={17} color={color || "rgba(255,255,255,.85)"} />
      {dot && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            background: "var(--color-saffron)",
            borderRadius: "50%",
            border: "1.5px solid var(--color-teal)",
          }}
        />
      )}
    </div>
  );
}
