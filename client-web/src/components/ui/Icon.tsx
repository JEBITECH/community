import type { CSSProperties } from "react";

/**
 * Inline SVG icon set.
 *
 * Replaces the Tabler webfont that was previously pulled from jsdelivr on every
 * page load: that was a render-blocking third-party request, broke offline, and
 * flashed unstyled boxes before the font arrived. Vectors also stay sharp at
 * high zoom.
 *
 * Names keep the original `ti-*` keys so call sites are unchanged, and `size`
 * is accepted in px for the same reason but rendered in em so the glyph scales
 * with its surrounding text.
 */

const PATHS: Record<string, string> = {
  "ti-arrow-left": "M15 5l-7 7 7 7M8 12h11",
  "ti-building-community":
    "M4 21V9l5-3 5 3v12M4 21h16M14 21V13h6v8M7 12h.01M7 15.5h.01M11 12h.01M11 15.5h.01M17 16h.01M17 18.5h.01",
  "ti-calendar": "M4 6.5h16v14H4zM4 10.5h16M8.5 4v3M15.5 4v3",
  "ti-calendar-event":
    "M4 6.5h16v14H4zM4 10.5h16M8.5 4v3M15.5 4v3M9 14h3v3H9z",
  "ti-check": "M4.5 12.5l5 5 10-11",
  "ti-chevron-down": "M5 9l7 7 7-7",
  "ti-clipboard-list":
    "M9 4h6v2.5H9zM8 4.5H6.5A1.5 1.5 0 005 6v13a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19V6a1.5 1.5 0 00-1.5-1.5H16M9 11h6M9 15h6",
  "ti-clock": "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 7.5V12l3 2",
  "ti-clock-hour-4": "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 7.5V12l3.5 2",
  "ti-heart-handshake":
    "M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0112 7.2a4.4 4.4 0 017.5 3.2c0 5-7.5 9.6-7.5 9.6zM12 8.5l-2 2 2 2 2-2z",
  "ti-list": "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  "ti-map-pin":
    "M12 21s6.5-5.6 6.5-10.3A6.5 6.5 0 005.5 10.7C5.5 15.4 12 21 12 21zM12 12.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z",
  "ti-plug-connected-x":
    "M7 12l5 5M3 21l3.5-3.5M13 4l7 7M9.5 6.5L6 10l8 8 3.5-3.5M17 3l4 4M21 3l-4 4",
  "ti-ticket":
    "M3 9V6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5V9a2.5 2.5 0 000 5v2.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5V14a2.5 2.5 0 000-5zM12 8v8",
  "ti-users":
    "M9 11.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM2.8 20a6.2 6.2 0 0112.4 0M16.5 5.3a3.2 3.2 0 010 5.4M18 20a6.3 6.3 0 00-1.6-4.2",
  "ti-x": "M18 6L6 18M6 6l12 12",
  "ti-search": "M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L20 20",
  "ti-speakerphone":
    "M18 8a3 3 0 010 6M10 9H7a3 3 0 000 6h3l6 3.5V5.5zM10 15v4.5",
  "ti-sun":
    "M12 16a4 4 0 100-8 4 4 0 000 8zM12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  "ti-calendar-check": "M4 6.5h16v14H4zM4 10.5h16M8.5 4v3M15.5 4v3M9.5 15l2 2 3.5-3.5",
  "ti-award":
    "M12 14.5a5 5 0 100-10 5 5 0 000 10zM8.5 13.8L7 21l5-2.5L17 21l-1.5-7.2",
  "ti-cake":
    "M4 15.5c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M4.5 21h15v-5.5h-15zM6.5 15.5v-3A2 2 0 018.5 10h7a2 2 0 012 2.5v3M12 10V7M12 4.5v.01",
  "ti-alert-triangle": "M12 4.5L21 19.5H3zM12 10v4M12 16.8v.01",
  "ti-receipt":
    "M6 3.5h12v17l-3-2-3 2-3-2-3 2zM9.5 8h5M9.5 12h5",
  "ti-user-edit":
    "M11 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5 20a6 6 0 016-6h.5M15 20.5l5-5 1.5 1.5-5 5H15z",
  "ti-logout":
    "M14 7V5.5A1.5 1.5 0 0012.5 4h-7A1.5 1.5 0 004 5.5v13A1.5 1.5 0 005.5 20h7a1.5 1.5 0 001.5-1.5V17M9.5 12H21m0 0l-3-3m3 3l-3 3",
  "ti-tag":
    "M4 12.5V5a1 1 0 011-1h7.5l7 7-8 8zM8 8h.01",
};

const FALLBACK = "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z";

interface IconProps {
  /** Icon key, e.g. "ti-calendar-event". */
  name: string;
  /** Nominal px size; rendered in em so it tracks surrounding text on zoom. */
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Set when the icon is the only content of a control. */
  title?: string;
}

export function Icon({
  name,
  size = 16,
  color,
  className,
  style,
  title,
}: IconProps) {
  const d = PATHS[name] ?? FALLBACK;
  const em = `${(size / 16).toFixed(3)}em`;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={em}
      height={em}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ flexShrink: 0, display: "block", ...style }}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}
