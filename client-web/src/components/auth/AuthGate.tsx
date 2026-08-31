"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SignInScreen } from "./SignInScreen";

/**
 * Renders the app for a signed-in resident, otherwise the sign-in screen.
 *
 * The session is a JWT in localStorage, which Next middleware (running on the
 * server) cannot read, so gating happens here. This is a UX boundary only --
 * every endpoint is independently authorized by the gateway and the services.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "var(--color-ivory)",
        }}
      >
        <span
          style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-tx3)" }}
        >
          Loading your community…
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return <SignInScreen />;

  return <>{children}</>;
}
