import { Progress } from "@/components/ui/progress";

interface ProgressMeterProps {
  raised: number;
  target: number;
  currencySymbol?: string;
  label?: string;
}

export default function ProgressMeter({ raised, target, currencySymbol = "₹", label }: ProgressMeterProps) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <Progress value={pct} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">
            {currencySymbol}
            {raised.toLocaleString("en-IN")}
          </span>{" "}
          raised of {currencySymbol}
          {target.toLocaleString("en-IN")}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
