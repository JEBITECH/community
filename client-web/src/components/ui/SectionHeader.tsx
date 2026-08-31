import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function SectionHeader({
  icon,
  title,
  right,
}: {
  icon: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-tx)",
          display: "flex",
          alignItems: "center",
          gap: 7,
          margin: 0,
        }}
      >
        <Icon name={icon} size={15} color="var(--color-teal)" />
        {title}
      </h3>
      {right}
    </div>
  );
}
