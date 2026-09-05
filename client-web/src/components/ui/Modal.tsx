"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Dialog sized in rem so it never exceeds the viewport at high zoom, with the
 * panel scrolling internally rather than the page scrolling sideways.
 *
 * Also focus-trapped, Escape-closable, and returns focus to the trigger.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  /** Nominal px width, converted to rem so it scales with zoom. */
  width = 440,
  hideHeader,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  hideHeader?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,40,38,.5)",
        zIndex: 200,
        display: "flex",
        // Centre the panel; it clamps its own height and scrolls internally, so
        // the overlay itself must NOT scroll (a scrolling overlay let the panel
        // grow past the viewport and pushed the pinned footer outside the card
        // on short/landscape screens).
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(0.75rem, 2vw, 1rem)",
        overflow: "hidden",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={hideHeader ? title : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={{
          background: "#fff",
          borderRadius: "0.875rem",
          // rem width, capped to the viewport so it can't cause overflow.
          width: `min(${(width / 16).toFixed(2)}rem, 100%)`,
          // Fill at most the overlay's height (which already subtracts its
          // padding). The panel is a strict flex column with overflow:hidden,
          // so the body scrolls internally while header/footer stay pinned and
          // nothing spills outside the rounded card.
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
          boxShadow: "0 0.5rem 2.5rem rgba(14,123,120,.18)",
        }}
      >
        {!hideHeader && (
          <div
            className="u-row u-row--between"
            style={{
              padding: "var(--space-4)",
              borderBottom: "1px solid var(--color-bdr)",
              background: "linear-gradient(90deg,var(--color-teal-light),#fff)",
              flexShrink: 0,
            }}
          >
            <h3
              className="u-min0"
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 600,
                color: "var(--color-teal-dark)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onClose}
              aria-label="Close dialog"
            >
              <Icon name="ti-x" size={14} />
            </Button>
          </div>
        )}

        <div
          style={{
            padding: "var(--space-4)",
            overflowY: "auto",
            minHeight: 0,
            flex: 1,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="u-row"
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderTop: "1px solid var(--color-bdr)",
              justifyContent: "flex-end",
              background: "var(--color-ivory)",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Definition grid used inside modals (label / value pairs). */
export function DefGrid({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl
      style={{
        display: "grid",
        // Labels get a floor but the value column absorbs the rest and wraps.
        gridTemplateColumns: "minmax(5rem, auto) minmax(0, 1fr)",
        gap: "var(--space-1) var(--space-4)",
        fontSize: "var(--text-xs)",
        background: "var(--color-teal-light)",
        borderRadius: "var(--radius-s)",
        padding: "var(--space-3)",
        margin: "0 0 var(--space-3)",
        border: "1px solid var(--color-bdr)",
      }}
    >
      {rows.map(([label, value], i) => (
        <div key={i} style={{ display: "contents" }}>
          <dt style={{ color: "var(--color-tx3)", fontWeight: 500 }}>{label}</dt>
          <dd
            style={{
              color: "var(--color-tx)",
              fontWeight: 600,
              margin: 0,
              minWidth: 0,
            }}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
