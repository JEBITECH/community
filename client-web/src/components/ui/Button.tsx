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
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  full?: boolean;
  /** Icon-only control: enforces a square minimum target and needs a label. */
  iconOnly?: boolean;
}

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  saffron: {
    background: "var(--color-saffron)",
    color: "#fff",
    borderColor: "var(--color-saffron-dark)",
    boxShadow: "0 0.125rem 0.375rem rgba(232,101,10,.3)",
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
    borderColor: "var(--color-bdr2)",
  },
  danger: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-tx)",
    borderColor: "var(--color-danger-bd)",
  },
};

/**
 * Every size clears the 2.75rem (44px) minimum interactive target from
 * WCAG 2.5.5. The old `sm` was ~18px tall, which is unhittable on touch and
 * hard to hit with a mouse at 80% zoom.
 */
const SIZE_STYLE: Record<"sm" | "md" | "lg", CSSProperties> = {
  sm: {
    padding: "0.375rem 0.6875rem",
    fontSize: "var(--text-2xs)",
    minHeight: "var(--tap)",
  },
  md: {
    padding: "0.5rem 0.875rem",
    fontSize: "var(--text-xs)",
    minHeight: "var(--tap)",
  },
  lg: {
    padding: "0.6875rem 1.25rem",
    fontSize: "var(--text-sm)",
    minHeight: "3rem",
  },
};

export function Button({
  variant = "ghost",
  size = "md",
  full,
  iconOnly,
  children,
  style,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: full ? "flex-start" : "center",
        gap: "var(--space-1)",
        borderRadius: "var(--radius-s)",
        fontWeight: 600,
        lineHeight: 1.3,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        borderWidth: "1px",
        borderStyle: "solid",
        fontFamily: "inherit",
        transition: "filter .18s",
        // Labels must wrap rather than force horizontal overflow.
        whiteSpace: "normal",
        textAlign: full ? "left" : "center",
        width: full ? "100%" : undefined,
        minWidth: iconOnly ? "var(--tap)" : undefined,
        ...SIZE_STYLE[size],
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = "brightness(.94)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "none";
      }}
    >
      {children}
    </button>
  );
}
