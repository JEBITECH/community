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
        boxShadow: "0 1px 4px rgba(14,123,120,.06)",
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
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-bdr)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(90deg,var(--color-teal-light),#fff)",
      }}
    >
      <h3
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-teal-dark)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          margin: 0,
        }}
      >
        {icon && <Icon name={icon} size={14} color="var(--color-teal)" />}
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
    <div style={{ padding: flush ? "0 16px" : "14px 16px", ...style }}>
      {children}
    </div>
  );
}
