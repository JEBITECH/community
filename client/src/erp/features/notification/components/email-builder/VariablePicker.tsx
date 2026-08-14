import { useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface VariableItem {
  key: string;
  label: string;
  example: string;
}

export interface VariableCategory {
  name: string;
  variables: VariableItem[];
}

const createVariable = (key: string, label: string, example: string): VariableItem => ({
  key,
  label,
  example,
});

// Legacy placeholder aliases are kept for preview compatibility while the picker
// inserts the canonical entity field names used by the notification payloads.
export const VARIABLE_KEY_ALIASES: Record<string, string> = {
  guest_name: "first_name",
  guest_email: "email",
  guest_phone: "phone_number",
  booking_id: "pmsId",
  check_in_date: "checkIn",
  check_out_date: "checkOut",
  room_type: "unitName",
  total_amount: "totalAmount",
  outstanding_balance: "totalAmount",
  property_address: "address",
  property_phone: "phone",
  wifi_password: "property_code",
  check_in_time: "checkIn",
  check_out_time: "checkOut",
  booking_link: "property_name",
  cancellation_link: "property_name",
  review_link: "property_name",
  task_id: "id",
  task_name: "task_title",
  task_description: "task_description",
  task_status: "inspection_status",
  task_priority: "priority",
  task_due_date: "updated_at",
  task_url: "id",
  assignee_name: "firstName",
  assigned_by: "created_by_id",
  created_by: "created_by_id",
  updated_by: "updated_at",
  completed_by: "inspected_by_id",
  completed_at: "updated_at",
  inspection_result: "inspection_status",
  inspection_completed_by: "inspected_by_id",
  inspection_completed_at: "updated_at",
  recipientName: "firstName",
  assigneeName: "firstName",
  taskTitle: "task_title",
  reservationId: "pmsId",
  reservationReference: "confirmationCode",
  reservationStartDate: "checkIn",
  reservationEndDate: "checkOut",
  guestName: "first_name",
  propertyName: "property_name",
};

export interface VariablePickerProps {
  onInsert: (variable: string) => void;
  onVariableSelect?: (variable: VariableItem) => void;
  categories?: VariableCategory[];
}

export const DEFAULT_CATEGORIES: VariableCategory[] = [
  {
    name: "Recipient",
    variables: [
      createVariable("firstName", "First Name", "John"),
      createVariable("lastName", "Last Name", "Smith"),
      createVariable("recipientEmail", "Email", "john@example.com"),
      createVariable("recipientPhone", "Phone", "+1 555 0100"),
      createVariable("role", "Role", "Inspector"),
    ],
  },

  {
    name: "Task",
    variables: [
      createVariable("task_id", "Task ID", "1024"),
      createVariable("task_title", "Task Title", "Inspect Room 305"),
      createVariable("task_description", "Task Description", ""),
      createVariable("priority", "Priority", "High"),
      createVariable("task_type", "Task Type", "Inspection"),
      createVariable("inspection_status", "Inspection Status", "Pending"),
      createVariable("property_id", "Property ID", "12"),
      createVariable("unit_id", "Unit ID", "305"),
    ],
  },

  {
    name: "Assignment",
    variables: [
      createVariable("assigned_to_id", "Assigned To User ID", "7b5c1d3e"),
      createVariable("assigned_to_team_id", "Assigned To Team ID", "15"),
      createVariable("created_by_id", "Created By User ID", "9f2e7c60"),
      createVariable("inspected_by_id", "Inspected By User ID", "4c6b9d31"),
      createVariable("vendor_id", "Vendor ID", "21"),
    ],
  },

  {
    name: "Property",
    variables: [
      createVariable("property_name", "Property Name", "Ocean View Villa"),
      createVariable("property_code", "Property Code", "OVV-01"),
      createVariable("property_type", "Property Type", "Villa"),
      createVariable("address", "Address", "123 Beach Road"),
      createVariable("city", "City", "Goa"),
      createVariable("state", "State", "Goa"),
      createVariable("country", "Country", "India"),
      createVariable("timezone", "Timezone", "Asia/Kolkata"),
    ],
  },

  {
    name: "Guest",
    variables: [
      createVariable("first_name", "First Name", "John"),
      createVariable("last_name", "Last Name", "Smith"),
      createVariable("email", "Email", "john@example.com"),
      createVariable("phone_number", "Phone Number", "+1 555 0100"),
      createVariable("city", "City", "New York"),
      createVariable("country", "Country", "United States"),
    ],
  },

  {
    name: "Reservation",
    variables: [
      createVariable("reservationId", "Reservation ID", "6a5f1d4668c4a25de8ae885c"),
      createVariable("pmsId", "PMS Reservation ID", "RES-10025"),
      createVariable("confirmationCode", "Confirmation Code", "CONF-12345"),
      createVariable("status", "Status", "Confirmed"),
      createVariable("guestFirstName", "Guest First Name", "John"),
      createVariable("guestLastName", "Guest Last Name", "Smith"),
      createVariable("guestName", "Guest Full Name", "John Smith"),
      createVariable("guestEmail", "Guest Email", "john@example.com"),
      createVariable("guestPhone", "Guest Phone", "+1 555 0100"),
      createVariable("propertyName", "Property Name", "Villa Sunset"),
      createVariable("checkIn", "Check-in Date", "2026-08-01"),
      createVariable("checkOut", "Check-out Date", "2026-08-07"),
      createVariable("nightsCount", "Nights Count", "4"),
      createVariable("numberOfGuests", "Number of Guests", "4"),
      createVariable("totalAmount", "Total Amount", "1200.00"),
      createVariable("currency", "Currency", "EUR"),
      createVariable("reservedUntilMinutes", "Hold Duration (minutes)", "15"),
      createVariable("unitId", "Unit ID", "305"),
      createVariable("unitName", "Unit Name", "Room 305"),
    ],
  },
];

export function VariablePicker({ onInsert, onVariableSelect, categories = DEFAULT_CATEGORIES }: VariablePickerProps) {
  const [open, setOpen] = useState(false);

  const handleInsert = (variable: VariableItem) => {
    onInsert(`{{${variable.key}}}`);
    onVariableSelect?.(variable);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" title="Insert Variable">
          <Braces className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="px-3 py-2 border-b">
          <h4 className="text-sm font-medium">Insert Variable</h4>
          <p className="text-xs text-muted-foreground">Click a variable to insert it into the template</p>
        </div>
        <ScrollArea className="h-96">
          <div className="p-2">
            {categories.map((category) => (
              <div key={category.name} className="mb-3 last:mb-0">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</div>
                <div className="space-y-0.5">
                  {category.variables.map((variable) => (
                    <button
                      type="button"
                      key={variable.key}
                      onClick={() => handleInsert(variable)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-left rounded-md hover:bg-accent transition-colors group"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{variable.label}</span>
                        <span className="text-xs text-muted-foreground truncate">{variable.example}</span>
                      </div>
                      <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-2 shrink-0 group-hover:bg-background">
                        {`{{${variable.key}}}`}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
