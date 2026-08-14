import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface InfoAlertProps {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  variant?: "warning" | "error" | "info" | "success";
  className?: string;
}

const variantStyles = {
  warning: {
    container:
      "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-800 dark:text-amber-300",
    description: "text-amber-700 dark:text-amber-400",
  },
  error: {
    container:
      "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-800 dark:text-red-300",
    description: "text-red-700 dark:text-red-400",
  },
  info: {
    container:
      "border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-300",
    description: "text-blue-700 dark:text-blue-400",
  },
  success: {
    container:
      "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    title: "text-green-800 dark:text-green-300",
    description: "text-green-700 dark:text-green-400",
  },
};

export const InfoAlert = ({
  title,
  description,
  icon,
  variant = "warning",
  className = "",
}: InfoAlertProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={`flex items-start gap-3 mb-6 rounded-lg border px-4 py-3 ${styles.container} ${className}`}
    >
      <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
        {icon || <AlertTriangle className="h-5 w-5" />}
      </div>

      <div>
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${styles.description}`}>
          {description}
        </p>
      </div>
    </div>
  );
};