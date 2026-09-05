"use client";

import { useId, useState, type CSSProperties } from "react";
import { useMemberLookup } from "@/lib/hooks/useActivity";
import type { BeneficiaryInput, BeneficiaryRelation } from "@/lib/api/types";

interface DraftBeneficiary {
  key: string;
  relation_type: BeneficiaryRelation;
  full_name: string;
  membership_id: string;
}

let keySeq = 0;
const newKey = () => `b${++keySeq}`;

const RELATION_LABELS: Record<BeneficiaryRelation, string> = {
  self: "Self",
  family: "Family member",
  other: "Other",
};

/**
 * Captures "single or multiple, self / family member / others" -- self is
 * always the current member (name filled in automatically, not editable);
 * family/other need a name, or a membership ID that's looked up to auto-fill
 * the name.
 *
 * Controlled from the outside: `onChange` fires with the current, validated
 * list of BeneficiaryInput rows (empty until at least one row is valid).
 */
export function BeneficiaryPicker({
  selfName,
  maxBeneficiaries,
  initialMode,
  initialBeneficiaries,
  onChange,
}: {
  /** Display name for the "Self" row -- purely a UI preview; the server
   * re-derives this independently and ignores anything sent from the client. */
  selfName: string;
  maxBeneficiaries?: number | null;
  initialMode?: "single" | "multiple";
  initialBeneficiaries?: BeneficiaryInput[];
  onChange: (beneficiaries: BeneficiaryInput[], mode: "single" | "multiple") => void;
}) {
  const initial =
    initialBeneficiaries && initialBeneficiaries.length > 0
      ? initialBeneficiaries
      : [{ relation_type: "self" as BeneficiaryRelation }];
  const [mode, setMode] = useState<"single" | "multiple">(
    initialMode ?? (initial.length > 1 ? "multiple" : "single"),
  );
  const initialSingle = initial[0];
  const [singleRelation, setSingleRelation] = useState<BeneficiaryRelation>(
    initialSingle.relation_type,
  );
  const [singleName, setSingleName] = useState(initialSingle.full_name ?? "");
  const [singleMembershipId, setSingleMembershipId] = useState(
    initialSingle.membership_id ?? "",
  );
  const [multiRows, setMultiRows] = useState<DraftBeneficiary[]>(
    initial.map((b) => ({
      key: newKey(),
      relation_type: b.relation_type,
      full_name: b.full_name ?? "",
      membership_id: b.membership_id ?? "",
    })),
  );
  const idPrefix = useId();

  const emit = (nextMode: "single" | "multiple", rows: DraftBeneficiary[]) => {
    const valid = rows
      .filter(
        (r) =>
          r.relation_type === "self" ||
          r.full_name.trim() ||
          r.membership_id.trim(),
      )
      .map<BeneficiaryInput>((r) => ({
        relation_type: r.relation_type,
        full_name:
          r.relation_type === "self" ? undefined : r.full_name.trim() || undefined,
        membership_id:
          r.relation_type === "self"
            ? undefined
            : r.membership_id.trim() || undefined,
      }));
    onChange(valid, nextMode);
  };

  const setSingle = (
    relation: BeneficiaryRelation,
    name: string,
    membershipId: string,
  ) => {
    setSingleRelation(relation);
    setSingleName(name);
    setSingleMembershipId(membershipId);
    emit("single", [
      { key: "single", relation_type: relation, full_name: name, membership_id: membershipId },
    ]);
  };

  const updateMultiRow = (key: string, patch: Partial<DraftBeneficiary>) => {
    const next = multiRows.map((r) => (r.key === key ? { ...r, ...patch } : r));
    setMultiRows(next);
    emit("multiple", next);
  };

  const canAddAnotherPerson =
    maxBeneficiaries == null || multiRows.length < maxBeneficiaries;

  const addMultiRow = () => {
    if (!canAddAnotherPerson) return;
    const next = [
      ...multiRows,
      { key: newKey(), relation_type: "family" as BeneficiaryRelation, full_name: "", membership_id: "" },
    ];
    setMultiRows(next);
    emit("multiple", next);
  };

  const removeMultiRow = (key: string) => {
    const next = multiRows.filter((r) => r.key !== key);
    setMultiRows(next);
    emit("multiple", next);
  };

  const switchMode = (next: "single" | "multiple") => {
    setMode(next);
    if (next === "single") {
      emit("single", [
        {
          key: "single",
          relation_type: singleRelation,
          full_name: singleName,
          membership_id: singleMembershipId,
        },
      ]);
    } else {
      emit("multiple", multiRows);
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div>
        <div style={labelStyle}>Registering for</div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {(["single", "multiple"] as const).map((m) => (
            <label key={m} style={radioLabelStyle}>
              <input
                type="radio"
                name={`${idPrefix}-mode`}
                checked={mode === m}
                onChange={() => switchMode(m)}
              />
              {m === "single" ? "Single" : "Multiple"}
            </label>
          ))}
        </div>
      </div>

      {mode === "single" ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {(["self", "family", "other"] as BeneficiaryRelation[]).map((r) => (
            <label key={r} style={rowBoxStyle}>
              <input
                type="radio"
                name={`${idPrefix}-single-relation`}
                checked={singleRelation === r}
                onChange={() => setSingle(r, singleName, singleMembershipId)}
              />
              {r === "self" ? `${RELATION_LABELS[r]} (${selfName})` : RELATION_LABELS[r]}
            </label>
          ))}
          {singleRelation !== "self" && (
            <BeneficiaryDetailFields
              relation={singleRelation}
              name={singleName}
              membershipId={singleMembershipId}
              onChange={(name, mid) => setSingle(singleRelation, name, mid)}
            />
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {multiRows.map((row) => (
            <div key={row.key} style={multiRowBoxStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {(["self", "family", "other"] as BeneficiaryRelation[]).map((r) => (
                    <label key={r} style={smallRadioLabelStyle}>
                      <input
                        type="radio"
                        name={`${idPrefix}-${row.key}-relation`}
                        checked={row.relation_type === r}
                        onChange={() =>
                          updateMultiRow(row.key, {
                            relation_type: r,
                            full_name: "",
                            membership_id: "",
                          })
                        }
                      />
                      {RELATION_LABELS[r]}
                    </label>
                  ))}
                </div>
                {multiRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMultiRow(row.key)}
                    style={removeBtnStyle}
                  >
                    Remove
                  </button>
                )}
              </div>
              {row.relation_type === "self" ? (
                <p style={selfNoteStyle}>{selfName} (you)</p>
              ) : (
                <BeneficiaryDetailFields
                  relation={row.relation_type}
                  name={row.full_name}
                  membershipId={row.membership_id}
                  onChange={(name, mid) => updateMultiRow(row.key, { full_name: name, membership_id: mid })}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={!canAddAnotherPerson}
            onClick={addMultiRow}
            style={addBtnStyle(canAddAnotherPerson)}
          >
            + Add another person
          </button>
        </div>
      )}
    </div>
  );
}

/** Name field + optional "or enter their membership ID to fetch their name"
 * lookup, shared by both the single and multiple layouts. */
function BeneficiaryDetailFields({
  relation,
  name,
  membershipId,
  onChange,
}: {
  relation: BeneficiaryRelation;
  name: string;
  membershipId: string;
  onChange: (name: string, membershipId: string) => void;
}) {
  const [showLookup, setShowLookup] = useState(false);
  const lookupEnabled = showLookup && membershipId.trim().length >= 8;
  const { data: lookedUp, isFetching, isError } = useMemberLookup(
    membershipId.trim(),
    lookupEnabled,
  );

  const applyLookup = () => {
    if (!lookedUp) return;
    const fullName = [lookedUp.first_name, lookedUp.last_name].filter(Boolean).join(" ");
    onChange(fullName, membershipId);
  };

  return (
    <div style={{ display: "grid", gap: "0.375rem" }}>
      <input
        placeholder={relation === "family" ? "Family member's name" : "Their name"}
        value={name}
        onChange={(e) => onChange(e.target.value, membershipId)}
        style={inputStyle}
      />
      {!showLookup ? (
        <button type="button" onClick={() => setShowLookup(true)} style={linkBtnStyle}>
          They&apos;re already a member — look up by membership ID instead
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            placeholder="Membership ID"
            value={membershipId}
            onChange={(e) => onChange(name, e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: "8rem" }}
          />
          {isFetching && (
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-tx3)" }}>
              Looking up…
            </span>
          )}
          {!isFetching && lookedUp && (
            <button type="button" onClick={applyLookup} style={useBtnStyle}>
              Use &quot;{[lookedUp.first_name, lookedUp.last_name].filter(Boolean).join(" ")}&quot;
            </button>
          )}
          {!isFetching && isError && membershipId.trim().length >= 8 && (
            <span style={{ fontSize: "var(--text-2xs)", color: "#8b1010" }}>Not found</span>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--color-tx2)",
  marginBottom: "0.375rem",
};

const radioLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.375rem",
  fontSize: "var(--text-sm)",
  color: "var(--color-tx)",
  cursor: "pointer",
};

const smallRadioLabelStyle: CSSProperties = {
  ...radioLabelStyle,
  fontSize: "var(--text-xs)",
};

const rowBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "var(--text-sm)",
  color: "var(--color-tx)",
  border: "1px solid var(--color-bdr)",
  borderRadius: "var(--radius-s)",
  padding: "0.5rem 0.625rem",
  cursor: "pointer",
};

const multiRowBoxStyle: CSSProperties = {
  border: "1px solid var(--color-bdr)",
  borderRadius: "var(--radius-s)",
  padding: "0.625rem",
  display: "grid",
  gap: "0.5rem",
};

const selfNoteStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-tx3)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "2.25rem",
  padding: "0 0.625rem",
  fontSize: "var(--text-sm)",
  fontFamily: "inherit",
  color: "var(--color-tx)",
  border: "1px solid var(--color-bdr2)",
  borderRadius: "var(--radius-s)",
  outline: "none",
};

const linkBtnStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-2xs)",
  fontWeight: 600,
  color: "var(--color-teal)",
  textAlign: "left",
};

const useBtnStyle: CSSProperties = {
  flexShrink: 0,
  padding: "0.3125rem 0.625rem",
  fontSize: "var(--text-2xs)",
  fontWeight: 600,
  color: "var(--color-teal)",
  background: "var(--color-teal-light)",
  border: "1px solid var(--color-bdr)",
  borderRadius: "var(--radius-s)",
  cursor: "pointer",
  fontFamily: "inherit",
};

const removeBtnStyle: CSSProperties = {
  flexShrink: 0,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-2xs)",
  fontWeight: 600,
  color: "#8b1010",
};

function addBtnStyle(enabled: boolean): CSSProperties {
  return {
    padding: "0.5rem 0.75rem",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    color: "var(--color-teal)",
    background: "#fff",
    border: "1px solid var(--color-bdr2)",
    borderRadius: "var(--radius-s)",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.55,
    fontFamily: "inherit",
    justifySelf: "start",
  };
}
