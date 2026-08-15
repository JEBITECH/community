import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Centralized status→color mapping so every screen's chips agree with each
 * other instead of ad hoc className choices per usage site. */
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
  published: "bg-success/15 text-success border-success/30",
  active: "bg-success/15 text-success border-success/30",
  approved: "bg-success/15 text-success border-success/30",
  recorded: "bg-success/15 text-success border-success/30",
  fulfilled: "bg-success/15 text-success border-success/30",
  open: "bg-warning/15 text-warning border-warning/30",
  completed: "bg-secondary/15 text-secondary border-secondary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  closed: "bg-muted text-muted-foreground border-border",
};

interface StatusChipProps {
  status: string;
  label?: string;
  className?: string;
}

export default function StatusChip({ status, label, className }: StatusChipProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", style, className)}>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
