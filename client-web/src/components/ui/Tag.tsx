import type { CSSProperties, ReactNode } from "react";

type TagTone =
  | "done"
  | "part"
  | "book"
  | "join"
  | "muted"
  | "urgent";

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
  },
  urgent: {
    background: "#fee8e8",
    color: "#8b1010",
    border: "1px solid #f0a0a0",
  },
};

export function Tag({ tone, children }: { tone: TagTone; children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 20,
        ...TONE_STYLE[tone],
      }}
    >
      {children}
    </span>
  );
}
