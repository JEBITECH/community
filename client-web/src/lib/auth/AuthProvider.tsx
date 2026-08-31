"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { setAuthFailureHandler } from "@/lib/api/client";
import {
  clearSession,
  decodeAccessToken,
  getAccessToken,
  readStoredJson,
  setAccessToken,
  STORAGE_KEYS,
  writeStoredJson,
} from "@/lib/api/tokens";
import {
  ORGANIZER_ROLES,
  type Membership,
  type Role,
  type User,
} from "@/lib/api/types";

interface AuthState {
  user: User | null;
  /** Active membership for the org the access token is scoped to. */
  membership: Membership | null;
  /** Every membership, including pending ones. */
  memberships: Membership[];
  /** Role from the JWT claim -- tracks the ACTIVE org, unlike `user.role`. */
  role: Role | null;
  organizationId: number | null;
  isAuthenticated: boolean;
  /** True until the stored session has been rehydrated. */
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Adopts a freshly issued session (from OTP verify / join). */
  adoptSession: (input: {
    user: User;
    accessToken: string;
    membership?: Membership | null;
  }) => void;
  signOut: () => Promise<void>;
  isOrganizer: boolean;
  /** `member_type` drives internal-vs-external pricing. */
  memberType: "internal" | "external" | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY: AuthState = {
  user: null,
  membership: null,
  memberships: [],
  role: null,
  organizationId: null,
  isAuthenticated: false,
  isLoading: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY);
  const queryClient = useQueryClient();

  const claimsOf = useCallback((token: string) => {
    const claims = decodeAccessToken(token);
    return {
      role: (claims?.role as Role | undefined) ?? null,
      organizationId: claims?.organizationId ?? null,
    };
  }, []);

  const reset = useCallback(() => {
    clearSession();
    queryClient.clear();
    setState({ ...EMPTY, isLoading: false });
  }, [queryClient]);

  // Wire the http client's unrecoverable-401 hook to local teardown.
  useEffect(() => {
    setAuthFailureHandler(() => reset());
    return () => setAuthFailureHandler(null);
  }, [reset]);

  // Rehydrate on mount.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getAccessToken();
      const storedUser = readStoredJson<User>(STORAGE_KEYS.user);

      if (!token || !storedUser) {
        setState({ ...EMPTY, isLoading: false });
        return;
      }

      const { role, organizationId } = claimsOf(token);

      // Optimistically restore so the shell renders immediately, then confirm
      // against the server. A dead token surfaces as a 401 the client handles.
      setState({
        user: storedUser,
        membership: null,
        memberships: [],
        role,
        organizationId,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        const { memberships } = await authApi.myMemberships();
        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          memberships,
          membership:
            memberships.find(
              (m) =>
                m.organization_id === organizationId && m.status === "active",
            ) ??
            memberships.find((m) => m.is_default && m.status === "active") ??
            null,
        }));
      } catch {
        // Leave the optimistic session; the next call triggers refresh-or-logout.
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [claimsOf]);

  const adoptSession = useCallback<AuthContextValue["adoptSession"]>(
    ({ user, accessToken, membership }) => {
      setAccessToken(accessToken);
      writeStoredJson(STORAGE_KEYS.user, user);

      const { role, organizationId } = claimsOf(accessToken);
      queryClient.clear();

      setState({
        user,
        membership: membership ?? null,
        memberships: membership ? [membership] : [],
        role,
        organizationId,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fill in the full membership list (with the organization relation, which
      // the login responses don't include) in the background.
      void authApi
        .myMemberships()
        .then(({ memberships }) =>
          setState((prev) => ({
            ...prev,
            memberships,
            membership:
              memberships.find(
                (m) =>
                  m.organization_id === organizationId && m.status === "active",
              ) ?? prev.membership,
          })),
        )
        .catch(() => undefined);
    },
    [claimsOf, queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clearing locally matters more than the round trip succeeding.
    }
    reset();
  }, [reset]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      adoptSession,
      signOut,
      isOrganizer: state.role ? ORGANIZER_ROLES.includes(state.role) : false,
      memberType: state.membership?.member_type ?? null,
    }),
    [state, adoptSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
