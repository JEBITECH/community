"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ModalKind } from "@/lib/types";
import { Modal, DefGrid } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface ModalContextValue {
  open: (kind: ModalKind) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within <ModalHost>");
  return ctx;
}

export function ModalHost({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModalKind | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const open = (kind: ModalKind) => setActive(kind);
  const close = () => setActive(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setActive("success");
  };

  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}

      {/* Join */}
      <Modal
        open={active === "join"}
        onClose={close}
        title="Confirm joining"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="teal"
              onClick={() =>
                showSuccess("Joined! You are on the list for Evening aarti.")
              }
            >
              Confirm
            </Button>
          </>
        }
      >
        <DefGrid
          rows={[
            ["Activity", "Evening aarti"],
            ["Date", "Today, 20 Sep"],
            ["Time", "7:30 PM"],
            ["Venue", "Mandap"],
            ["Price", <span key="p" style={{ color: "var(--color-teal)" }}>Free</span>],
          ]}
        />
      </Modal>

      {/* Volunteer */}
      <Modal
        open={active === "vol"}
        onClose={close}
        title="Apply to volunteer"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="saffron"
              onClick={() =>
                showSuccess(
                  "Application sent! The organizer will confirm your spot."
                )
              }
            >
              Submit application
            </Button>
          </>
        }
      >
        <DefGrid
          rows={[
            ["Role", "Decoration team"],
            ["Date", "19 Sep · 5:00 PM"],
            [
              "Spots left",
              <span key="s" style={{ color: "var(--color-saffron)" }}>
                4 remaining
              </span>,
            ],
            ["Organizer", "Ravi Mehta"],
          ]}
        />
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-tx2)",
            marginBottom: 6,
          }}
        >
          Message to organizer (optional)
        </div>
        <textarea
          placeholder="Why would you like to volunteer?"
          style={textareaStyle}
        />
      </Modal>

      {/* Book */}
      <Modal
        open={active === "book"}
        onClose={close}
        title="Book community dinner"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="saffron"
              onClick={() =>
                showSuccess("Booking confirmed! Reference #GF-0249.")
              }
            >
              Confirm booking
            </Button>
          </>
        }
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-tx2)",
            marginBottom: 8,
          }}
        >
          Select members to book for
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 14,
          }}
        >
          <BookRow label="Jay Shah (me)" defaultChecked />
          <BookRow label="Sarth Shah (son)" />
        </div>
        <DefGrid
          rows={[
            ["Date", "24 Sep · 9:00 PM"],
            ["Seats", "1 selected"],
            ["Total", "₹250"],
          ]}
        />
      </Modal>

      {/* Wish */}
      <Modal
        open={active === "wish"}
        onClose={close}
        title="Send a birthday wish"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="teal"
              onClick={() => showSuccess("Wish sent to Priya Shah!")}
            >
              Send wish
            </Button>
          </>
        }
      >
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg,var(--color-saffron),#f07820)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
            }}
          >
            PS
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-tx)" }}>
            Priya Shah · A-204
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <Button variant="ghost" style={{ justifyContent: "flex-start" }}>
            Happy birthday! 🎂
          </Button>
          <Button variant="ghost" style={{ justifyContent: "flex-start" }}>
            Have a wonderful year ahead! 🎉
          </Button>
          <Button variant="ghost" style={{ justifyContent: "flex-start" }}>
            Wishing you lots of joy! 🪔
          </Button>
        </div>
        <textarea
          placeholder="Or write your own message..."
          style={{ ...textareaStyle, height: 56 }}
        />
      </Modal>

      {/* Success */}
      <Modal open={active === "success"} onClose={close} hideHeader>
        <div style={{ textAlign: "center", padding: "14px 6px" }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,var(--color-teal),var(--color-teal-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 4px 16px rgba(14,123,120,.3)",
            }}
          >
            <Icon name="ti-check" size={24} color="#fff" />
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-teal-dark)",
              marginBottom: 6,
            }}
          >
            Done!
          </div>
          <div style={{ fontSize: 13, color: "var(--color-tx2)" }}>
            {successMsg}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 22,
              justifyContent: "center",
            }}
          >
            <Button variant="ghost">
              <Icon name="ti-calendar-plus" size={13} /> Add to calendar
            </Button>
            <Button variant="teal" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </ModalContext.Provider>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--color-bdr)",
  borderRadius: "var(--radius-s)",
  padding: "8px 10px",
  fontSize: 12,
  fontFamily: "inherit",
  resize: "none",
  height: 66,
  color: "var(--color-tx)",
  background: "var(--color-ivory)",
  outline: "none",
};

function BookRow({
  label,
  defaultChecked,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--color-ivory-dark)",
        borderRadius: "var(--radius-s)",
        padding: "9px 12px",
        cursor: "pointer",
        border: "1px solid var(--color-bdr)",
      }}
    >
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        style={{ accentColor: "var(--color-teal)" }}
      />
      <span style={{ fontSize: 13, color: "var(--color-tx)" }}>{label}</span>
    </label>
  );
}
