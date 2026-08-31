import type { CSSProperties } from "react";

interface IconProps {
  name: string; // Tabler icon name, e.g. "ti-calendar-event"
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Thin wrapper over the Tabler webfont so icon usage stays declarative
 * and consistent across the app.
 */
export function Icon({ name, size = 16, color, className, style }: IconProps) {
  return (
    <i
      className={`ti ${name}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size, color, ...style }}
      aria-hidden="true"
    />
  );
}
