import type { CSSProperties, ReactNode } from "react";

type TagTone = "done" | "part" | "book" | "join" | "muted" | "urgent";

const TONE_STYLE: Record<TagTone, CSSProperties> = {
  done: {
    background: "var(--color-done-bg)",
    color: "var(--color-done-tx)",
    border: "1px solid var(--color-done-bd)",
  },
  part: {
    background: "var(--color-part-bg)",
    color: "var(--color-part-tx)",
    border: "1px solid var(--color-part-bd)",
  },
  book: {
    background: "var(--color-book-bg)",
    color: "var(--color-book-tx)",
    border: "1px solid var(--color-book-bd)",
  },
  join: {
    background: "var(--color-join-bg)",
    color: "var(--color-join-tx)",
    border: "1px solid var(--color-join-bd)",
  },
  muted: {
    background: "var(--color-ivory-dark)",
    color: "var(--color-tx3)",
    border: "1px solid var(--color-bdr)",
  },
  urgent: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-tx)",
    border: "1px solid var(--color-danger-bd)",
  },
};

export function Tag({
  tone,
  children,
}: {
  tone: TagTone;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        padding: "0.125rem 0.5rem",
        borderRadius: "var(--radius-pill)",
        lineHeight: 1.4,
        // Must wrap: "Registration open" is long enough to overflow a card.
        whiteSpace: "normal",
        ...TONE_STYLE[tone],
      }}
    >
      {children}
    </span>
  );
}
