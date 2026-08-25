import { Input } from "@/components/ui/input";
import { GuestInfo } from "../api/guest";

export default function GuestInfoFields({
  value,
  onChange,
}: {
  value: GuestInfo;
  onChange: (next: GuestInfo) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
          <Input value={value.first_name} onChange={(e) => onChange({ ...value, first_name: e.target.value })} placeholder="Jane" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
          <Input value={value.last_name || ""} onChange={(e) => onChange({ ...value, last_name: e.target.value })} placeholder="Doe" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
        <Input value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} placeholder="9999999999" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email (optional)</label>
        <Input
          type="email"
          value={value.email || ""}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          placeholder="jane@example.com"
        />
      </div>
    </div>
  );
}
