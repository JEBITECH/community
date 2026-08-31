import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import type { AttendeeInput, AttendeeType } from "../api/participations";

interface Row {
  key: string;
  attendee_type: AttendeeType;
  name: string;
  membership_id: string;
}

const newRow = (type: AttendeeType = "other"): Row => ({
  key: Math.random().toString(36).slice(2),
  attendee_type: type,
  name: "",
  membership_id: "",
});

export default function ParticipateDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  selfName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (attendees: AttendeeInput[]) => void;
  isSubmitting: boolean;
  selfName: string;
}) {
  const [mode, setMode] = useState<"single" | "multiple">("single");
  const [rows, setRows] = useState<Row[]>([newRow("self")]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMode("single");
    setRows([newRow("self")]);
    setError(null);
  };

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const handleModeChange = (next: "single" | "multiple") => {
    setMode(next);
    setRows(next === "single" ? [rows[0] ?? newRow("self")] : rows.length ? rows : [newRow("self")]);
  };

  const handleSubmit = () => {
    const selfCount = rows.filter((r) => r.attendee_type === "self").length;
    if (selfCount > 1) {
      setError('Only one attendee can be marked "Self".');
      return;
    }
    for (const r of rows) {
      if (r.attendee_type !== "self" && !r.name.trim() && !r.membership_id.trim()) {
        setError("Every family member or guest needs a name, or a membership ID to look them up.");
        return;
      }
    }
    setError(null);
    const attendees: AttendeeInput[] = rows.map((r) => ({
      attendee_type: r.attendee_type,
      name: r.attendee_type === "self" ? undefined : r.name.trim() || undefined,
      membership_id: r.membership_id.trim() || undefined,
    }));
    onConfirm(attendees);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Participate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Who's this for?</label>
            <RadioGroup value={mode} onValueChange={(v) => handleModeChange(v as "single" | "multiple")} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="single" /> Single
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="multiple" /> Multiple
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={row.key} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={row.attendee_type} onValueChange={(v) => updateRow(row.key, { attendee_type: v as AttendeeType })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">For Self</SelectItem>
                      <SelectItem value="family">Family member</SelectItem>
                      <SelectItem value="other">Someone else</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === "multiple" && rows.length > 1 && (
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => removeRow(row.key)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {row.attendee_type === "self" ? (
                  <p className="text-xs text-muted-foreground">{selfName} (you)</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Name"
                      value={row.name}
                      onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    />
                    <Input
                      placeholder="Membership ID (optional)"
                      value={row.membership_id}
                      onChange={(e) => updateRow(row.key, { membership_id: e.target.value })}
                    />
                  </div>
                )}
                {i === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Have their membership ID? Enter it instead of typing a name — we'll pull it up automatically.
                  </p>
                )}
              </div>
            ))}
          </div>

          {mode === "multiple" && (
            <Button variant="outline" shape="pill" size="sm" className="gap-1" onClick={() => setRows((prev) => [...prev, newRow("family")])}>
              <Plus className="w-4 h-4" /> Add another attendee
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button shape="pill" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Submitting…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
