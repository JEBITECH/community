import type { CSSProperties } from "react";
import { Icon } from "./Icon";

type PillKind = "joined" | "volunteer" | "participant" | "book";

const KIND_STYLE: Record<PillKind, CSSProperties> = {
  joined: { background: "var(--color-done-bg)", color: "var(--color-done-tx)" },
  volunteer: { background: "var(--color-vol-bg)", color: "var(--color-vol-tx)" },
  participant: {
    background: "var(--color-part-bg)",
    color: "var(--color-part-tx)",
  },
  book: { background: "var(--color-book-bg)", color: "var(--color-book-tx)" },
};

export function StatusPill({
  kind,
  icon,
  children,
}: {
  kind: PillKind;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        padding: "0.1875rem 0.5rem",
        borderRadius: "var(--radius-pill)",
        lineHeight: 1.4,
        whiteSpace: "normal",
        ...KIND_STYLE[kind],
      }}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}
