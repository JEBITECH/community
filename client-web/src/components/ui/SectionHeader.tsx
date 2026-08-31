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
    // Wraps so a long title and its action don't collide as space narrows.
    <div
      className="u-row u-row--between"
      style={{ marginBottom: "var(--space-3)", gap: "var(--space-2)" }}
    >
      <h3
        className="u-min0"
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-tx)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        <Icon name={icon} size={16} color="var(--color-teal)" />
        {title}
      </h3>
      {right}
    </div>
  );
}
