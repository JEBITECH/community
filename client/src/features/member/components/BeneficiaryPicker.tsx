import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { BeneficiaryInput, BeneficiaryRelation } from "../api/participations";
import { useMemberLookup } from "../hooks/useMembers";

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
 * Captures "single or multiple, self / family member / others" the way the
 * requirements describe it: self is always the current member (name filled
 * in automatically, not editable); family/other need a name, or a
 * membership ID that's looked up to auto-fill the name — "option to add
 * more details ... they can also add the membership id, to fetch the data".
 *
 * Controlled from the outside: `onChange` fires with the current, validated
 * list of BeneficiaryInput rows (empty until at least one row is valid).
 */
export default function BeneficiaryPicker({
  selfName,
  maxBeneficiaries,
  onChange,
}: {
  /** Display name for the "Self" row — comes from the logged-in member's own
   * profile; the server re-derives this independently and ignores anything
   * sent from the client, this is purely for the UI preview. */
  selfName: string;
  maxBeneficiaries?: number;
  onChange: (beneficiaries: BeneficiaryInput[], mode: "single" | "multiple") => void;
}) {
  const [mode, setMode] = useState<"single" | "multiple">("single");
  const [singleRelation, setSingleRelation] = useState<BeneficiaryRelation>("self");
  const [singleName, setSingleName] = useState("");
  const [singleMembershipId, setSingleMembershipId] = useState("");
  const [multiRows, setMultiRows] = useState<DraftBeneficiary[]>([{ key: newKey(), relation_type: "self", full_name: "", membership_id: "" }]);

  const emit = (nextMode: "single" | "multiple", rows: DraftBeneficiary[]) => {
    const valid = rows
      .filter((r) => r.relation_type === "self" || r.full_name.trim() || r.membership_id.trim())
      .map<BeneficiaryInput>((r) => ({
        relation_type: r.relation_type,
        full_name: r.relation_type === "self" ? undefined : r.full_name.trim() || undefined,
        membership_id: r.relation_type === "self" ? undefined : r.membership_id.trim() || undefined,
      }));
    onChange(valid, nextMode);
  };

  const setSingle = (relation: BeneficiaryRelation, name: string, membershipId: string) => {
    setSingleRelation(relation);
    setSingleName(name);
    setSingleMembershipId(membershipId);
    emit("single", [{ key: "single", relation_type: relation, full_name: name, membership_id: membershipId }]);
  };

  const updateMultiRow = (key: string, patch: Partial<DraftBeneficiary>) => {
    const next = multiRows.map((r) => (r.key === key ? { ...r, ...patch } : r));
    setMultiRows(next);
    emit("multiple", next);
  };

  const addMultiRow = () => {
    if (maxBeneficiaries && multiRows.length >= maxBeneficiaries) return;
    const next = [...multiRows, { key: newKey(), relation_type: "family" as BeneficiaryRelation, full_name: "", membership_id: "" }];
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
      emit("single", [{ key: "single", relation_type: singleRelation, full_name: singleName, membership_id: singleMembershipId }]);
    } else {
      emit("multiple", multiRows);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Registering for</label>
        <RadioGroup value={mode} onValueChange={(v) => switchMode(v as "single" | "multiple")} className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="single" id="mode-single" />
            Single
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="multiple" id="mode-multiple" />
            Multiple
          </label>
        </RadioGroup>
      </div>

      {mode === "single" ? (
        <div className="space-y-3">
          <RadioGroup
            value={singleRelation}
            onValueChange={(v) => setSingle(v as BeneficiaryRelation, singleName, singleMembershipId)}
            className="flex flex-col gap-2"
          >
            {(["self", "family", "other"] as BeneficiaryRelation[]).map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm rounded-lg border border-border p-2">
                <RadioGroupItem value={r} />
                {r === "self" ? `${RELATION_LABELS[r]} (${selfName})` : RELATION_LABELS[r]}
              </label>
            ))}
          </RadioGroup>
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
        <div className="space-y-3">
          {multiRows.map((row) => (
            <div key={row.key} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <RadioGroup
                  value={row.relation_type}
                  onValueChange={(v) => updateMultiRow(row.key, { relation_type: v as BeneficiaryRelation, full_name: "", membership_id: "" })}
                  className="flex gap-3"
                >
                  {(["self", "family", "other"] as BeneficiaryRelation[]).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-xs">
                      <RadioGroupItem value={r} />
                      {RELATION_LABELS[r]}
                    </label>
                  ))}
                </RadioGroup>
                {multiRows.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeMultiRow(row.key)} className="h-7 w-7 p-0">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
              {row.relation_type === "self" ? (
                <p className="text-xs text-muted-foreground">{selfName} (you)</p>
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
          <Button
            size="sm"
            variant="outline"
            shape="pill"
            className="gap-1"
            disabled={!!maxBeneficiaries && multiRows.length >= maxBeneficiaries}
            onClick={addMultiRow}
          >
            <Plus className="w-3.5 h-3.5" /> Add another person
          </Button>
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
  const { data: lookedUp, isFetching, isError } = useMemberLookup(membershipId.trim(), lookupEnabled);

  const applyLookup = () => {
    if (!lookedUp) return;
    const fullName = [lookedUp.first_name, lookedUp.last_name].filter(Boolean).join(" ");
    onChange(fullName, membershipId);
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder={relation === "family" ? "Family member's name" : "Their name"}
        value={name}
        onChange={(e) => onChange(e.target.value, membershipId)}
      />
      {!showLookup ? (
        <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowLookup(true)}>
          They're already a member — look up by membership ID instead
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Membership ID"
            value={membershipId}
            onChange={(e) => onChange(name, e.target.value)}
            className="flex-1"
          />
          {isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          {!isFetching && lookedUp && (
            <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={applyLookup}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Use "{[lookedUp.first_name, lookedUp.last_name].filter(Boolean).join(" ")}"
            </Button>
          )}
          {!isFetching && isError && membershipId.trim().length >= 8 && (
            <span className="text-xs text-destructive shrink-0">Not found</span>
          )}
        </div>
      )}
    </div>
  );
}