"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { STORAGE_KEYS, writeStoredJson } from "@/lib/api/tokens";
import { humanize } from "@/lib/utils/format";

const labelStyle = {
  display: "block",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--color-tx2)",
  marginBottom: "0.3125rem",
} as const;

const inputStyle = {
  width: "100%",
  minHeight: "var(--tap)",
  padding: "0 0.625rem",
  fontSize: "var(--text-base)",
  fontFamily: "inherit",
  color: "var(--color-tx)",
  background: "#fff",
  border: "1px solid var(--color-bdr2)",
  borderRadius: "var(--radius-s)",
  outline: "none",
} as const;

/**
 * Resident profile editing.
 *
 * Sends only firstName/lastName/email/phone/dob. The endpoint's DTO also
 * accepts role/roleId/isActive and does not verify the caller owns the target
 * id, so exposing those here would be handing out a privilege-escalation path.
 *
 * Membership details (role, unit, member type) are shown read-only: they're
 * set by the committee, not self-service.
 */
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { user, membership } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dob, setDob] = useState((user?.dob ?? "").slice(0, 10));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (!user) return;
    if (!firstName.trim()) {
      setError("First name can't be empty.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await authApi.updateProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dob: dob || undefined,
      });

      // The endpoint returns only {status,message}, so the local copy is
      // patched from what we sent rather than from the response.
      writeStoredJson(STORAGE_KEYS.user, {
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        dob: dob || null,
      });

      setSaved(true);
      // Simplest way to get every consumer of `user` onto the new values.
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Your profile"
      width={430}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="saffron" onClick={submit} disabled={busy || saved}>
            {saved ? "Saved" : busy ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: "0.6875rem" }}>
        <div className="u-fields-2">
          <div>
            <label htmlFor="p-fn" style={labelStyle}>
              First name
            </label>
            <input
              id="p-fn"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError(null);
              }}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="p-ln" style={labelStyle}>
              Last name
            </label>
            <input
              id="p-ln"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-email" style={labelStyle}>
            Email
          </label>
          <input
            id="p-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div className="u-fields-2">
          <div>
            <label htmlFor="p-phone" style={labelStyle}>
              Phone
            </label>
            <input
              id="p-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="p-dob" style={labelStyle}>
              Date of birth
            </label>
            <input
              id="p-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Committee-managed, so read-only here. */}
        {membership && (
          <div
            style={{
              marginTop: "0.1875rem",
              padding: "0.625rem 0.75rem",
              background: "var(--color-teal-light)",
              border: "1px solid var(--color-bdr)",
              borderRadius: "var(--radius-s)",
              display: "grid",
              gridTemplateColumns: "minmax(5rem, auto) minmax(0, 1fr)",
              gap: "var(--space-1) var(--space-3)",
              fontSize: "var(--text-sm)",
            }}
          >
            <span style={{ color: "var(--color-tx3)", fontWeight: 500 }}>
              Flat / unit
            </span>
            <span style={{ color: "var(--color-tx)", fontWeight: 600 }}>
              {membership.unit_identifier || "—"}
            </span>
            <span style={{ color: "var(--color-tx3)", fontWeight: 500 }}>
              Membership
            </span>
            <span style={{ color: "var(--color-tx)", fontWeight: 600 }}>
              {humanize(membership.role)}
            </span>
            <span style={{ color: "var(--color-tx3)", fontWeight: 500 }}>
              Member type
            </span>
            <span style={{ color: "var(--color-tx)", fontWeight: 600 }}>
              {membership.member_type === "internal" ? "Resident" : "Guest"}
            </span>
          </div>
        )}

        <p style={{ margin: "0rem", fontSize: "var(--text-xs)", color: "var(--color-tx3)" }}>
          Your flat and membership are managed by the committee.
        </p>

        {error && (
          <p
            role="alert"
            style={{
              margin: "0rem",
              padding: "0.5rem 0.625rem",
              fontSize: "var(--text-sm)",
              color: "#8b1010",
              background: "#fee8e8",
              border: "1px solid #f0a0a0",
              borderRadius: "var(--radius-s)",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
