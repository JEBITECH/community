import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // optional: if you use a utility like `classnames`

interface AppButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  minWidth?: string; // default to 120px
  className?: string;
  type?: "button" | "submit" | "reset";
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onClick,
  variant = "default",
  icon,
  disabled = false,
  loading = false,
  minWidth = "120px",
  className,
  type = "button",
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 font-medium px-4 py-2 transition-all",
        "min-w-[120px]", // default min width
        "hover:opacity-90 disabled:opacity-50",
        className
      )}
      style={{ minWidth }}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="animate-spin border-2 border-t-transparent rounded-full w-4 h-4" />
          Loading...
        </div>
      ) : (
        <>
          {icon && <span className="text-base">{icon}</span>}
          {label}
        </>
      )}
    </Button>
  );
};

export default AppButton;