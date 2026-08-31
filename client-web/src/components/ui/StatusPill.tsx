import type { CSSProperties } from "react";
import { Icon } from "./Icon";

type PillKind = "joined" | "volunteer" | "participant" | "book";

const KIND_STYLE: Record<PillKind, CSSProperties> = {
  joined: { background: "var(--color-done-bg)", color: "var(--color-done-tx)" },
  volunteer: { background: "var(--color-vol-bg)", color: "var(--color-vol-tx)" },
  participant: { background: "var(--color-part-bg)", color: "var(--color-part-tx)" },
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
        gap: 3,
        fontSize: 9,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 10,
        marginTop: 4,
        ...KIND_STYLE[kind],
      }}
    >
      {icon && <Icon name={icon} size={10} />}
      {children}
    </span>
  );
}
