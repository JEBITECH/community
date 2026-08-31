import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-bdr)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        // Without this a card inside a grid track can be widened by its
        // content instead of wrapping.
        minWidth: 0,
        boxShadow: "0 0.0625rem 0.25rem rgba(14,123,120,.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHead({
  icon,
  title,
  right,
}: {
  icon?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div
      // Wraps so a long title plus an action control never overflow.
      className="u-row u-row--between"
      style={{
        padding: "var(--space-3) var(--space-4)",
        borderBottom: "1px solid var(--color-bdr)",
        background: "linear-gradient(90deg,var(--color-teal-light),#fff)",
        gap: "var(--space-2)",
      }}
    >
      <h3
        className="u-min0"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-teal-dark)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {icon && <Icon name={icon} size={15} color="var(--color-teal)" />}
        {title}
      </h3>
      {right}
    </div>
  );
}

export function CardBody({
  children,
  flush,
  style,
}: {
  children: ReactNode;
  flush?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        padding: flush ? "0 var(--space-4)" : "var(--space-4)",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
