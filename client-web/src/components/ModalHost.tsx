"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Modal, DefGrid } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  useCancelParticipation,
  useParticipate,
  useVolunteerSignUp,
} from "@/lib/hooks/useActivity";
import {
  useComponentAvailability,
  useEvent,
  useVolunteerRoles,
} from "@/lib/hooks/useEvents";
import {
  formatDateFull,
  formatMoney,
  formatTimeRange,
  toNumber,
} from "@/lib/utils/format";

/**
 * Every write the resident can make, driven by a typed request so each dialog
 * knows exactly which event/component/role it is acting on.
 */
export type ModalRequest =
  /** RSVP to a whole event, or to one activity within it. */
  | { kind: "join"; eventId: string; componentId?: string }
  /** Reserve seats on a component that requires booking. */
  | { kind: "book"; eventId: string; componentId: string }
  /** Pick a volunteer role on an event. */
  | { kind: "volunteer"; eventId: string; roleId?: string }
  /** Withdraw an existing participation. */
  | { kind: "cancel"; participationId: string; label: string };

interface ModalContextValue {
  open: (request: ModalRequest) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within <ModalHost>");
  return ctx;
}

export function ModalHost({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ModalRequest | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const value = useMemo<ModalContextValue>(
    () => ({
      open: (next) => {
        setSuccessMsg(null);
        setRequest(next);
      },
      close: () => setRequest(null),
    }),
    [],
  );

  const close = () => setRequest(null);
  const succeed = (msg: string) => {
    setRequest(null);
    setSuccessMsg(msg);
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {request?.kind === "join" && (
        <JoinDialog request={request} onClose={close} onDone={succeed} />
      )}
      {request?.kind === "book" && (
        <BookDialog request={request} onClose={close} onDone={succeed} />
      )}
      {request?.kind === "volunteer" && (
        <VolunteerDialog request={request} onClose={close} onDone={succeed} />
      )}
      {request?.kind === "cancel" && (
        <CancelDialog request={request} onClose={close} onDone={succeed} />
      )}

      <Modal
        open={successMsg !== null}
        onClose={() => setSuccessMsg(null)}
        hideHeader
        width={370}
      >
        <div style={{ textAlign: "center", padding: "0.375rem 0 0.125rem" }}>
          <div
            style={{
              width: "2.875rem",
              height: "2.875rem",
              margin: "0 auto 0.75rem",
              borderRadius: "50%",
              background: "var(--color-done-bg)",
              border: "1px solid var(--color-done-bd)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="ti-check" size={22} color="var(--color-done-tx)" />
          </div>
          <p
            style={{
              margin: "0rem",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: "var(--color-tx)",
              lineHeight: 1.5,
            }}
          >
            {successMsg}
          </p>
          <div style={{ marginTop: "0.875rem" }}>
            <Button variant="teal" onClick={() => setSuccessMsg(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </ModalContext.Provider>
  );
}

// ---------------------------------------------------------------------------

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      style={{
        margin: "0 0 0.75rem",
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

/** Finds a component inside a loaded event's day/component tree. */
function useComponent(eventId: string, componentId?: string) {
  const { data } = useEvent(eventId);

  const component = componentId
    ? data?.days
        ?.flatMap((d) => d.components ?? [])
        .find((c) => c.id === componentId)
    : undefined;

  return { event: data, component };
}

function JoinDialog({
  request,
  onClose,
  onDone,
}: {
  request: Extract<ModalRequest, { kind: "join" }>;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const { event, component } = useComponent(request.eventId, request.componentId);
  const { memberType } = useAuth();
  const participate = useParticipate();
  const [error, setError] = useState<string | null>(null);

  const target = component?.name ?? event?.name ?? "this event";
  const price = toNumber(
    memberType === "external"
      ? component?.price_external
      : component?.price_internal,
  );

  async function confirm() {
    setError(null);
    try {
      await participate.mutateAsync({
        event_id: request.eventId,
        event_component_id: request.componentId,
        type: "join",
      });
      onDone(`You're on the list for ${target}.`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Confirm joining"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="teal"
            onClick={confirm}
            disabled={participate.isPending}
          >
            {participate.isPending ? "Joining…" : "Confirm"}
          </Button>
        </>
      }
    >
      {error && <ErrorNote message={error} />}

      <DefGrid
        rows={[
          ["Activity", target],
          ...(event
            ? ([["Date", formatDateFull(event.start_date)]] as [string, ReactNode][])
            : []),
          ...(component?.start_time
            ? ([
                [
                  "Time",
                  formatTimeRange(component.start_time, component.end_time),
                ],
              ] as [string, ReactNode][])
            : []),
          ...(event?.venue
            ? ([["Venue", event.venue]] as [string, ReactNode][])
            : []),
          ["Price", price > 0 ? formatMoney(price) : "Free"],
        ]}
      />

      <p
        style={{
          margin: "0rem",
          fontSize: "var(--text-sm)",
          lineHeight: 1.6,
          color: "var(--color-tx2)",
        }}
      >
        You&apos;ll find this under My activity once confirmed.
      </p>
    </Modal>
  );
}

function BookDialog({
  request,
  onClose,
  onDone,
}: {
  request: Extract<ModalRequest, { kind: "book" }>;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const { event, component } = useComponent(request.eventId, request.componentId);
  const { memberType } = useAuth();
  const availability = useComponentAvailability(request.componentId);
  const participate = useParticipate();

  const [seats, setSeats] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const count = Number(seats);
  const valid = Number.isInteger(count) && count >= 1;

  const unitPrice = toNumber(
    memberType === "external"
      ? component?.price_external
      : component?.price_internal,
  );
  const remaining = availability.data?.available;

  async function confirm() {
    if (!valid) {
      setError("Enter at least one seat.");
      return;
    }

    setError(null);
    try {
      await participate.mutateAsync({
        event_id: request.eventId,
        event_component_id: request.componentId,
        type: "book",
        seats_requested: count,
      });
      onDone(
        `Booked ${count} ${count === 1 ? "seat" : "seats"} for ${
          component?.name ?? "the activity"
        }.`,
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Book ${component?.name ?? "activity"}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="book"
            onClick={confirm}
            disabled={participate.isPending || !valid}
          >
            {participate.isPending ? "Booking…" : "Confirm booking"}
          </Button>
        </>
      }
    >
      {error && <ErrorNote message={error} />}

      <label
        htmlFor="seats"
        style={{
          display: "block",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-tx2)",
          marginBottom: "0.3125rem",
        }}
      >
        Number of seats
      </label>
      <input
        id="seats"
        type="number"
        min={1}
        max={remaining ?? undefined}
        inputMode="numeric"
        value={seats}
        autoFocus
        onChange={(e) => {
          setSeats(e.target.value);
          setError(null);
        }}
        style={{
          width: "100%",
          height: "2.375rem",
          padding: "0 0.625rem",
          marginBottom: "0.8125rem",
          fontSize: "var(--text-base)",
          fontFamily: "inherit",
          color: "var(--color-tx)",
          border: "1px solid var(--color-bdr2)",
          borderRadius: "var(--radius-s)",
          outline: "none",
        }}
      />

      <DefGrid
        rows={[
          ["Event", event?.name ?? "—"],
          ["Activity", component?.name ?? "—"],
          ...(component?.start_time
            ? ([
                [
                  "Time",
                  formatTimeRange(component.start_time, component.end_time),
                ],
              ] as [string, ReactNode][])
            : []),
          ...(remaining !== null && remaining !== undefined
            ? ([["Seats left", String(remaining)]] as [string, ReactNode][])
            : []),
          unitPrice > 0
            ? ["Price each", formatMoney(unitPrice)]
            : ["Price", "Free"],
          ...(unitPrice > 0 && valid
            ? ([["Total", formatMoney(unitPrice * count)]] as [
                string,
                ReactNode,
              ][])
            : []),
        ]}
      />
    </Modal>
  );
}

function VolunteerDialog({
  request,
  onClose,
  onDone,
}: {
  request: Extract<ModalRequest, { kind: "volunteer" }>;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const roles = useVolunteerRoles(request.eventId);
  const signUp = useVolunteerSignUp();
  const [selected, setSelected] = useState<string | null>(
    request.roleId ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const open = (roles.data ?? []).filter((r) => r.status !== "closed");

  async function confirm() {
    if (!selected) {
      setError("Pick a role first.");
      return;
    }

    setError(null);
    try {
      await signUp.mutateAsync(selected);
      const role = open.find((r) => r.id === selected);
      onDone(
        `You're signed up for ${role?.title ?? "the role"}. The committee will confirm.`,
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Apply to volunteer"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="vol"
            onClick={confirm}
            disabled={signUp.isPending || !selected}
          >
            {signUp.isPending ? "Signing up…" : "Confirm"}
          </Button>
        </>
      }
    >
      {error && <ErrorNote message={error} />}

      {roles.isLoading ? (
        <p style={{ margin: "0rem", fontSize: "var(--text-sm)", color: "var(--color-tx3)" }}>
          Loading roles…
        </p>
      ) : open.length === 0 ? (
        <p style={{ margin: "0rem", fontSize: "var(--text-sm)", color: "var(--color-tx3)" }}>
          No volunteer roles are open for this event.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {open.map((role) => {
            const left = Math.max(
              0,
              role.headcount_needed - role.headcount_filled,
            );
            const full = left === 0;
            const isSelected = selected === role.id;

            return (
              <button
                key={role.id}
                type="button"
                disabled={full}
                onClick={() => {
                  setSelected(role.id);
                  setError(null);
                }}
                style={{
                  textAlign: "left",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "var(--radius-s)",
                  border: `1.5px solid ${
                    isSelected ? "var(--color-vol-bd)" : "var(--color-bdr)"
                  }`,
                  background: isSelected ? "var(--color-vol-bg)" : "#fff",
                  cursor: full ? "not-allowed" : "pointer",
                  opacity: full ? 0.55 : 1,
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.625rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: 600,
                      color: "var(--color-tx)",
                    }}
                  >
                    {role.title}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      color: full ? "#8b1010" : "var(--color-vol-tx)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {full ? "Full" : `${left} needed`}
                  </span>
                </div>
                {(role.slot_start || role.slot_end) && (
                  <div
                    style={{
                      marginTop: "0.1875rem",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-tx3)",
                    }}
                  >
                    {formatTimeRange(role.slot_start, role.slot_end)}
                  </div>
                )}
                {role.description && (
                  <div
                    style={{
                      marginTop: "0.1875rem",
                      fontSize: "var(--text-xs)",
                      lineHeight: 1.5,
                      color: "var(--color-tx2)",
                    }}
                  >
                    {role.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function CancelDialog({
  request,
  onClose,
  onDone,
}: {
  request: Extract<ModalRequest, { kind: "cancel" }>;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const cancel = useCancelParticipation();
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    try {
      await cancel.mutateAsync(request.participationId);
      onDone(`Cancelled ${request.label}.`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Cancel this?"
      width={380}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={confirm}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "Cancelling…" : "Yes, cancel"}
          </Button>
        </>
      }
    >
      {error && <ErrorNote message={error} />}
      <p
        style={{
          margin: "0rem",
          fontSize: "var(--text-base)",
          lineHeight: 1.6,
          color: "var(--color-tx2)",
        }}
      >
        This will remove your place for{" "}
        <strong style={{ color: "var(--color-tx)" }}>{request.label}</strong>. You
        can sign up again later if there&apos;s still room.
      </p>
    </Modal>
  );
}
