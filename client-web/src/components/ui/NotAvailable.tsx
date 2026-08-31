import { Icon } from "./Icon";

/**
 * Placeholder for parts of the design that have no backend yet.
 *
 * Deliberately explicit rather than showing invented content: announcements,
 * birthdays, discussions and family members were all mock data in the
 * prototype and there are no endpoints behind them, so stating that is more
 * useful than fabricating rows.
 */
export function NotAvailable({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        padding: "0.875rem 0.9375rem",
        background: "var(--color-ivory-dark)",
        border: "1px dashed var(--color-bdr2)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <Icon
        name="ti-plug-connected-x"
        size={16}
        color="var(--color-tx3)"
      />
      <div style={{ minWidth: "0rem" }}>
        <div
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-tx2)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "0.1875rem",
            fontSize: "var(--text-xs)",
            lineHeight: 1.55,
            color: "var(--color-tx3)",
          }}
        >
          {detail ??
            "This section needs a backend endpoint before it can show real data."}
        </div>
      </div>
    </div>
  );
}

/** Small inline empty state for lists that are genuinely empty. */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "1.125rem 0.9375rem",
        textAlign: "center",
        fontSize: "var(--text-sm)",
        color: "var(--color-tx3)",
        background: "#fff",
        border: "1px dashed var(--color-bdr2)",
        borderRadius: "var(--radius-card)",
      }}
    >
      {children}
    </div>
  );
}

/** Skeleton row used while a list is loading. */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" style={{ display: "grid", gap: "0.625rem" }}>
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "3.875rem",
            background: "#fff",
            border: "1px solid var(--color-bdr)",
            borderRadius: "var(--radius-card)",
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
