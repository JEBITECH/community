export function ProgressBar({
  value,
  color,
  /** Nominal px cap, converted to rem; the bar is fluid up to that width. */
  width,
  label,
}: {
  value: number;
  color: string;
  width?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      style={{
        height: "0.3125rem",
        background: "var(--color-ivory-dark)",
        borderRadius: "var(--radius-pill)",
        marginTop: "var(--space-1)",
        overflow: "hidden",
        width: "100%",
        maxWidth: width ? `${(width / 16).toFixed(2)}rem` : undefined,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: "var(--radius-pill)",
          width: `${pct}%`,
          background: color,
          transition: "width .4s",
        }}
      />
    </div>
  );
}
