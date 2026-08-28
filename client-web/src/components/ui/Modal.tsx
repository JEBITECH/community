"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
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
  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,40,38,.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: "#fff",
          borderRadius: 14,
          width,
          maxWidth: "92vw",
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(14,123,120,.18)",
        }}
      >
        {!hideHeader && (
          <div
            style={{
              padding: "15px 18px",
              borderBottom: "1px solid var(--color-bdr)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(90deg,var(--color-teal-light),#fff)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-teal-dark)",
                margin: 0,
              }}
            >
              {title}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <Icon name="ti-x" size={13} />
            </Button>
          </div>
        )}
        <div style={{ padding: 18 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--color-bdr)",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              background: "var(--color-ivory)",
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "5px 14px",
        fontSize: 12,
        background: "var(--color-teal-light)",
        borderRadius: "var(--radius-s)",
        padding: "11px 13px",
        marginBottom: 13,
        border: "1px solid var(--color-bdr)",
      }}
    >
      {rows.map(([l, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <span style={{ color: "var(--color-tx3)", fontWeight: 500 }}>{l}</span>
          <span style={{ color: "var(--color-tx)", fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
