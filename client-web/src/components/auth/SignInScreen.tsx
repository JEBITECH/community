"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { authApi } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useOrganization } from "@/lib/org/useOrganization";
import type { Membership, User } from "@/lib/api/types";

/** auth-svc enforces a 60s per-email cooldown; mirror it in the UI. */
const RESEND_COOLDOWN = 60;

// LEGACY (SMS): type Step =
//   | { kind: "phone" }
//   | { kind: "code"; phone: string; devOtp?: string }
//   | { kind: "join"; otpVerifiedToken: string };
type Step =
  | { kind: "email" }
  | { kind: "code"; email: string; devOtp?: string }
  | { kind: "join"; otpVerifiedToken: string };

/**
 * Email-OTP sign-in.
 *
 * This is the resident flow auth-svc actually implements: request a code,
 * verify it, and for an unrecognised email complete a join request.
 *
 * NOTE: switched from phone/SMS OTP to email OTP — the old phone steps are
 * preserved as commented blocks below.
 */
export function SignInScreen() {
  const [step, setStep] = useState<Step>({ kind: "email" });
  const { data: org } = useOrganization();
  const { adoptSession } = useAuth();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(160deg,var(--color-teal-dark),var(--color-teal) 55%,#0b6a67)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "23.75rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          {org?.organization_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.organization_logo}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: "0.875rem", display: "inline-block" }}
            />
          ) : (
            <div
              style={{
                width: "3.25rem",
                height: "3.25rem",
                margin: "0 auto",
                borderRadius: "0.875rem",
                background: "rgba(255,255,255,.18)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="ti-building-community" size={26} color="#fff" />
            </div>
          )}

          <h1
            style={{
              marginTop: "0.75rem",
              marginBottom: "0.25rem",
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {org?.organization_name ?? "Your community"}
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "rgba(255,255,255,.75)", margin: "0rem" }}>
            {step.kind === "join"
              ? "A few details and you're in."
              : "Sign in with your email"}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "var(--radius-card)",
            padding: "1.25rem",
            boxShadow: "0 8px 28px rgba(0,0,0,.18)",
          }}
        >
          {/* LEGACY (SMS):
          {step.kind === "phone" && (
            <PhoneStep
              onSent={(phone, devOtp) => setStep({ kind: "code", phone, devOtp })}
            />
          )} */}

          {step.kind === "email" && (
            <EmailStep
              onSent={(email, devOtp) => setStep({ kind: "code", email, devOtp })}
            />
          )}

          {step.kind === "code" && (
            <CodeStep
              email={step.email}
              devOtp={step.devOtp}
              onBack={() => setStep({ kind: "email" })}
              onNewMember={(token) =>
                setStep({ kind: "join", otpVerifiedToken: token })
              }
              onSignedIn={adoptSession}
            />
          )}

          {step.kind === "join" && (
            <JoinStep
              otpVerifiedToken={step.otpVerifiedToken}
              organizationId={org?.organization_id}
              requiresCode={!org || org.membership_model === "invite_only"}
              orgName={org?.organization_name}
              onSignedIn={adoptSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const labelStyle = {
  display: "block",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--color-tx2)",
  marginBottom: "0.375rem",
} as const;

const inputStyle = {
  width: "100%",
  minHeight: "var(--tap)",
  padding: "0 0.6875rem",
  fontSize: "var(--text-base)",
  fontFamily: "inherit",
  color: "var(--color-tx)",
  background: "#fff",
  border: "1px solid var(--color-bdr2)",
  borderRadius: "var(--radius-s)",
  outline: "none",
} as const;

const submitStyle = {
  width: "100%",
  minHeight: "var(--tap)",
  marginTop: "0.875rem",
  fontSize: "var(--text-base)",
  fontWeight: 600,
  fontFamily: "inherit",
  color: "#fff",
  background: "var(--color-saffron)",
  border: "1px solid var(--color-saffron-dark)",
  borderRadius: "var(--radius-s)",
  cursor: "pointer",
} as const;

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      style={{
        margin: "0.625rem 0 0",
        padding: "0.5rem 0.625rem",
        fontSize: "var(--text-sm)",
        lineHeight: 1.5,
        color: "#8b1010",
        background: "#fee8e8",
        border: "1px solid #f0a0a0",
        borderRadius: "var(--radius-s)",
      }}
    >
      {message}
    </p>
  );
}

function EmailStep({
  onSent,
}: {
  onSent: (email: string, devOtp?: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = email.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError("Enter a valid email address.");

    setBusy(true);
    setError(null);
    try {
      const res = await authApi.requestOtp(trimmed);
      onSent(trimmed, res.debug_otp);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="email" style={labelStyle}>
        Email address
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        style={inputStyle}
      />
      <p style={{ margin: "0.375rem 0 0", fontSize: "var(--text-xs)", color: "var(--color-tx3)" }}>
        We&apos;ll email you a 6-digit code.
      </p>

      {error && <ErrorNote message={error} />}

      <button type="submit" disabled={busy || !valid} style={submitStyle}>
        {busy ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}

/* LEGACY (SMS) — phone-number entry step. Restore this (and the phone Step
   variants / CodeStep props) to switch member sign-in back to SMS OTP.

function PhoneStep({
  onSent,
}: {
  onSent: (phone: string, devOtp?: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length >= 7 && digits.length <= 15;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError("Enter a valid phone number.");

    setBusy(true);
    setError(null);
    try {
      const res = await authApi.requestOtp(digits);
      onSent(digits, res.debug_otp);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="phone" style={labelStyle}>Phone number</label>
      <input id="phone" type="tel" inputMode="numeric" autoComplete="tel" autoFocus
        placeholder="98765 43210" value={phone}
        onChange={(e) => { setPhone(e.target.value); setError(null); }}
        style={inputStyle} />
      <p>We&apos;ll text you a 6-digit code.</p>
      {error && <ErrorNote message={error} />}
      <button type="submit" disabled={busy || !valid} style={submitStyle}>
        {busy ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}
*/

function CodeStep({
  email,
  devOtp,
  onBack,
  onNewMember,
  onSignedIn,
}: {
  email: string;
  devOtp?: string;
  onBack: () => void;
  onNewMember: (token: string) => void;
  onSignedIn: (s: {
    user: User;
    accessToken: string;
    membership?: Membership | null;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setError("Enter the 6-digit code.");

    setBusy(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp(email, code);
      if (res.isNewUser) {
        onNewMember(res.otpVerifiedToken);
        return;
      }
      onSignedIn({
        user: res.user,
        accessToken: res.accessToken,
        membership: res.membership ?? null,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      await authApi.requestOtp(email);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          marginBottom: "0.75rem",
          padding: "0rem",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          fontFamily: "inherit",
          color: "var(--color-teal)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Icon name="ti-arrow-left" size={13} /> Change email
      </button>

      <label htmlFor="code" style={labelStyle}>
        Verification code
      </label>
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, ""));
          setError(null);
        }}
        style={{ ...inputStyle, letterSpacing: "0.35em", fontWeight: 600 }}
      />
      <p style={{ margin: "0.375rem 0 0", fontSize: "var(--text-xs)", color: "var(--color-tx3)" }}>
        Sent to {email}
      </p>

      {/*
        auth-svc returns the code in non-production so local dev works without
        a configured SMTP server.
      */}
      {devOtp && (
        <p
          style={{
            margin: "0.625rem 0 0",
            padding: "0.5rem 0.625rem",
            fontSize: "var(--text-sm)",
            color: "var(--color-teal-dark)",
            background: "var(--color-teal-light)",
            border: "1px solid var(--color-teal-mid)",
            borderRadius: "var(--radius-s)",
          }}
        >
          Development mode — your code is{" "}
          <strong style={{ letterSpacing: "0.12em" }}>{devOtp}</strong>
        </p>
      )}

      {error && <ErrorNote message={error} />}

      <button
        type="submit"
        disabled={busy || code.length !== 6}
        style={submitStyle}
      >
        {busy ? "Verifying…" : "Verify & continue"}
      </button>

      <div style={{ textAlign: "center", marginTop: "0.625rem" }}>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || busy}
          style={{
            padding: "0rem",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            fontFamily: "inherit",
            color: cooldown > 0 ? "var(--color-tx3)" : "var(--color-teal)",
            background: "none",
            border: "none",
            cursor: cooldown > 0 ? "default" : "pointer",
          }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

function JoinStep({
  otpVerifiedToken,
  organizationId,
  requiresCode,
  orgName,
  onSignedIn,
}: {
  otpVerifiedToken: string;
  organizationId?: number;
  requiresCode: boolean;
  orgName?: string;
  onSignedIn: (s: {
    user: User;
    accessToken: string;
    membership?: Membership | null;
  }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [unit, setUnit] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return setError("Please tell us your name.");
    if (requiresCode && !inviteCode.trim()) {
      return setError("An invitation code is required to join.");
    }

    setBusy(true);
    setError(null);
    try {
      const res = await authApi.joinCommunity({
        otpVerifiedToken,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        unitIdentifier: unit.trim() || undefined,
        // The API prefers invitationCode when both are supplied.
        invitationCode: inviteCode.trim() || undefined,
        organizationId: inviteCode.trim() ? undefined : organizationId,
      });

      if (res.status === "pending") {
        // approval_required orgs issue no tokens until an admin acts.
        setPending(true);
        return;
      }

      onSignedIn({
        user: res.user,
        accessToken: res.accessToken,
        membership: res.membership,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
        <div
          style={{
            width: "2.75rem",
            height: "2.75rem",
            margin: "0 auto 0.75rem",
            borderRadius: "50%",
            background: "var(--color-book-bg)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="ti-clock-hour-4" size={22} color="var(--color-book-tx)" />
        </div>
        <p
          style={{
            margin: "0rem",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-tx)",
          }}
        >
          Request submitted
        </p>
        <p
          style={{
            margin: "0.375rem auto 0",
            maxWidth: "17.5rem",
            fontSize: "var(--text-sm)",
            lineHeight: 1.6,
            color: "var(--color-tx2)",
          }}
        >
          This community needs a committee member to approve you. You&apos;ll be
          able to sign in as soon as that happens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div>
          <label htmlFor="fn" style={labelStyle}>
            First name
          </label>
          <input
            id="fn"
            autoFocus
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError(null);
            }}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="ln" style={labelStyle}>
            Last name
          </label>
          <input
            id="ln"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="unit" style={labelStyle}>
            Flat / unit
          </label>
          <input
            id="unit"
            placeholder="A-101"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={inputStyle}
          />
          <p
            style={{ margin: "0.375rem 0 0", fontSize: "var(--text-xs)", color: "var(--color-tx3)" }}
          >
            Helps neighbours recognise you in the directory.
          </p>
        </div>

        {requiresCode && (
          <div>
            <label htmlFor="code" style={labelStyle}>
              Invitation code
            </label>
            <input
              id="code"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError(null);
              }}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      <button type="submit" disabled={busy} style={submitStyle}>
        {busy ? "Joining…" : `Join ${orgName ?? "community"}`}
      </button>
    </form>
  );
}
