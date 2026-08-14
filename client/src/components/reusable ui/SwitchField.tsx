import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SwitchFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  layout?: "inline" | "card";
  
  // Class name styling
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  switchWrapperClassName?: string;
  switchClassName?: string;
  
  // Inline style props
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
  switchWrapperStyle?: React.CSSProperties;
  switchStyle?: React.CSSProperties;
  
  // Layout options
  justify?: "start" | "between" | "end" | "center";
  align?: "start" | "center" | "end";
  gap?: "none" | "sm" | "md" | "lg";
  
  // Card specific options
  bordered?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * SwitchField - A fully customizable switch wrapper with class and inline style support
 * 
 * FIXED: justify prop now works correctly - label won't stretch when using start/center/end
 */
const SwitchField = React.forwardRef<HTMLDivElement, SwitchFieldProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      label,
      description,
      layout = "inline",
      
      // Class names
      className,
      containerClassName,
      contentClassName,
      labelClassName,
      descriptionClassName,
      switchWrapperClassName,
      switchClassName,
      
      // Inline styles
      style,
      containerStyle,
      contentStyle,
      labelStyle,
      descriptionStyle,
      switchWrapperStyle,
      switchStyle,
      
      // Layout props
      justify = "between",
      align = "center",
      gap = "md",
      bordered = true,
      rounded = "lg",
      padding = "md",
    },
    ref
  ) => {
    // Map justify values to Tailwind classes
    const justifyClasses = {
      start: "justify-start",
      between: "justify-between",
      end: "justify-end",
      center: "justify-center",
    };

    // Map align values to Tailwind classes
    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    };

    // Map gap values to Tailwind classes
    const gapClasses = {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };

    // Map rounded values to Tailwind classes
    const roundedClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };

    // Map padding values to Tailwind classes
    const paddingClasses = {
      none: "p-0",
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
    };

    // FIXED: Only use flex-1 when justify is "between"
    const shouldLabelStretch = justify === "between";

    if (layout === "card") {
      return (
        <div
          ref={ref}
          className={cn("relative", className)}
          style={{ overflow: 'clip', ...style }}
        >
          <div
            className={cn(
              "flex",
              justifyClasses[justify],
              alignClasses[align],
              bordered && "border border-border",
              roundedClasses[rounded],
              paddingClasses[padding],
              contentClassName
            )}
            style={contentStyle}
          >
            <div 
              className={cn(
                "space-y-1 min-w-0",
                shouldLabelStretch && "flex-1",
                containerClassName
              )}
              style={containerStyle}
            >
              {label && (
                <label 
                  className={cn("text-sm font-medium text-foreground block", labelClassName)}
                  style={labelStyle}
                >
                  {label}
                </label>
              )}
              {description && (
                <p 
                  className={cn("text-xs text-muted-foreground", descriptionClassName)}
                  style={descriptionStyle}
                >
                  {description}
                </p>
              )}
            </div>
            <div 
              className={cn("flex-shrink-0", switchWrapperClassName)} 
              style={{ marginRight: '-7px', ...switchWrapperStyle }}
            >
              <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className={switchClassName}
                style={switchStyle}
              />
            </div>
          </div>
        </div>
      );
    }

    // Inline layout - FIXED: flex-1 only when justify="between"
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        style={{ overflow: 'clip', ...style }}
      >
        <div 
          className={cn(
            "flex",
            justifyClasses[justify],
            alignClasses[align],
            gapClasses[gap],
            "py-3",
            contentClassName
          )}
          style={contentStyle}
        >
          <div 
            className={cn(
              "min-w-0",
              shouldLabelStretch && "flex-1",
              containerClassName
            )}
            style={containerStyle}
          >
            {label && (
              <label 
                className={cn("text-sm font-medium text-foreground block", labelClassName)}
                style={labelStyle}
              >
                {label}
              </label>
            )}
          </div>
          <div 
            className={cn("flex-shrink-0", switchWrapperClassName)} 
            style={{ marginRight: '-2px', ...switchWrapperStyle }}
          >
            <Switch
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
              className={switchClassName}
              style={switchStyle}
            />
          </div>
        </div>
        {description && (
          <p 
            className={cn("text-xs text-muted-foreground mt-1", descriptionClassName)}
            style={descriptionStyle}
          >
            {description}
          </p>
        )}
      </div>
    );
  }
);

SwitchField.displayName = "SwitchField";

export { SwitchField };
export type { SwitchFieldProps };