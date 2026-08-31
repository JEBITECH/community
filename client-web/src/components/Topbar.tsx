"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useOrganization } from "@/lib/org/useOrganization";
import { fullName, initials } from "@/lib/utils/format";

/**
 * Organisation branding + the signed-in resident.
 *
 * Name and logo come from the organization record (public by-subdomain lookup
 * before sign-in, the active membership's org afterwards) -- not from config.
 *
 * The bar wraps rather than squashing, and `u-sticky` releases the sticky
 * positioning on short/narrow viewports so two stacked bars can't consume the
 * screen at high zoom.
 */
export function Topbar() {
  const { user, membership } = useAuth();
  const { data: publicOrg } = useOrganization();

  const orgName =
    membership?.organization?.organization_name ??
    publicOrg?.organization_name ??
    "Community";
  const logo =
    membership?.organization?.organization_logo ?? publicOrg?.organization_logo;

  return (
    <header
      className="u-sticky"
      style={{
        top: "0.3125rem",
        background:
          "linear-gradient(135deg,var(--color-teal-dark) 0%,var(--color-teal) 100%)",
        borderBottom: "0.125rem solid var(--color-gold-light)",
      }}
    >
      <div
        className="u-container u-row u-row--between"
        style={{
          minHeight: "3.625rem",
          paddingBlock: "var(--space-2)",
          gap: "var(--space-3)",
        }}
      >
        {/* Brand */}
        <div
          className="u-min0"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span
            style={{
              width: "2.375rem",
              height: "2.375rem",
              flexShrink: 0,
              background: logo
                ? "rgba(255,255,255,.14)"
                : "linear-gradient(135deg,var(--color-gold-light),var(--color-gold))",
              borderRadius: "0.625rem",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              border: "0.09375rem solid rgba(255,255,255,.3)",
            }}
          >
            {logo ? (
              // Plain <img>: the stored value may be a data URI or an arbitrary
              // external URL, neither of which suits next/image's loader.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              initials(orgName)
            )}
          </span>

          <span className="u-min0">
            <span
              style={{
                display: "block",
                fontSize: "var(--text-md)",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.25,
              }}
            >
              {orgName}
            </span>
            <span
              style={{
                display: "block",
                fontSize: "var(--text-2xs)",
                color: "rgba(255,255,255,.7)",
                lineHeight: 1.4,
              }}
            >
              Together we celebrate, participate and connect
            </span>
          </span>
        </div>

        <AccountChip
          name={fullName(user?.firstName, user?.lastName)}
          unit={membership?.unit_identifier ?? null}
        />
      </div>
    </header>
  );
}

function AccountChip({ name, unit }: { name: string; unit: string | null }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          minHeight: "var(--tap)",
          padding: "0.25rem 0.75rem 0.25rem 0.25rem",
          borderRadius: "var(--radius-pill)",
          border: "1px solid rgba(255,255,255,.25)",
          cursor: "pointer",
          background: "rgba(255,255,255,.12)",
          fontFamily: "inherit",
          maxWidth: "min(15rem, 60vw)",
        }}
      >
        <span
          style={{
            width: "1.875rem",
            height: "1.875rem",
            flexShrink: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg,var(--color-gold-light),var(--color-saffron))",
            color: "#fff",
            fontSize: "var(--text-2xs)",
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
          }}
        >
          {initials(name.split(" ")[0], name.split(" ")[1])}
        </span>

        {/*
          No nowrap here: the previous build forced the name and flat onto one
          line, which pushed the header wider than the viewport on phones.
        */}
        <span
          className="u-min0"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            color: "#fff",
            textAlign: "left",
            lineHeight: 1.3,
          }}
        >
          {name}
          {unit && (
            <span
              style={{
                display: "block",
                color: "rgba(255,255,255,.72)",
                fontSize: "var(--text-2xs)",
              }}
            >
              {unit}
            </span>
          )}
        </span>

        <Icon name="ti-chevron-down" size={13} color="rgba(255,255,255,.6)" />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "var(--space-2)",
            width: "max(13rem, 60vw)",
            maxWidth: "min(17rem, 90vw)",
            background: "#fff",
            border: "1px solid var(--color-bdr)",
            borderRadius: "var(--radius-card)",
            boxShadow: "0 0.625rem 1.875rem rgba(0,0,0,.16)",
            overflow: "hidden",
            zIndex: 200,
          }}
        >
          <div
            style={{
              padding: "var(--space-3)",
              borderBottom: "1px solid var(--color-bdr)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--color-tx)",
              }}
            >
              {name}
            </div>
            {unit && (
              <div
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--color-tx3)",
                  marginTop: "0.125rem",
                }}
              >
                {unit}
              </div>
            )}
          </div>

          <MenuItem
            icon="ti-user-edit"
            label="Update profile"
            onClick={() => {
              setOpen(false);
              setEditing(true);
            }}
          />
          <MenuItem
            icon="ti-logout"
            label="Sign out"
            danger
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          />
        </div>
      )}

      {editing && <ProfileDialog onClose={() => setEditing(false)} />}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        width: "100%",
        minHeight: "var(--tap)",
        padding: "var(--space-2) var(--space-3)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        fontFamily: "inherit",
        textAlign: "left",
        color: danger ? "var(--color-danger-tx)" : "var(--color-tx2)",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "var(--color-danger-bg)"
          : "var(--color-teal-light)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
      }}
    >
      <Icon
        name={icon}
        size={16}
        color={danger ? "var(--color-danger-tx)" : "var(--color-teal)"}
      />
      {label}
    </button>
  );
}
