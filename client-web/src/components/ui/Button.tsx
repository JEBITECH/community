"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export type ButtonVariant =
  | "saffron"
  | "teal"
  | "join"
  | "joined"
  | "vol"
  | "book"
  | "part"
  | "ghost"
  | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  children: ReactNode;
  full?: boolean;
}

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  saffron: {
    background: "var(--color-saffron)",
    color: "#fff",
    borderColor: "var(--color-saffron-dark)",
    boxShadow: "0 2px 6px rgba(232,101,10,.3)",
  },
  teal: {
    background: "var(--color-teal)",
    color: "#fff",
    borderColor: "var(--color-teal-dark)",
  },
  join: {
    background: "var(--color-join-bg)",
    color: "var(--color-join-tx)",
    borderColor: "var(--color-join-bd)",
  },
  joined: {
    background: "var(--color-done-bg)",
    color: "var(--color-done-tx)",
    borderColor: "var(--color-done-bd)",
  },
  vol: {
    background: "var(--color-vol-bg)",
    color: "var(--color-vol-tx)",
    borderColor: "var(--color-vol-bd)",
  },
  book: {
    background: "var(--color-book-bg)",
    color: "var(--color-book-tx)",
    borderColor: "var(--color-book-bd)",
  },
  part: {
    background: "var(--color-part-bg)",
    color: "var(--color-part-tx)",
    borderColor: "var(--color-part-bd)",
  },
  ghost: {
    background: "#fff",
    color: "var(--color-tx2)",
    borderColor: "var(--color-bdr)",
  },
  danger: {
    background: "#fee8e8",
    color: "#8b1010",
    borderColor: "#f0a0a0",
  },
};

export function Button({
  variant = "ghost",
  size = "md",
  full,
  children,
  style,
  ...rest
}: ButtonProps) {
  const sizeStyle: CSSProperties =
    size === "sm"
      ? { padding: "4px 9px", fontSize: 10 }
      : { padding: "5px 11px", fontSize: 11 };

  return (
    <button
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: "var(--radius-s)",
        fontWeight: 500,
        cursor: "pointer",
        borderWidth: 1,
        borderStyle: "solid",
        fontFamily: "inherit",
        transition: "all .18s",
        whiteSpace: "nowrap",
        width: full ? "100%" : undefined,
        justifyContent: full ? "flex-start" : undefined,
        ...sizeStyle,
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}
