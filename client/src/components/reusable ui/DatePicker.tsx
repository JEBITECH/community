import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  /** Current selected date value (YYYY-MM-DD string or Date object) */
  value?: string | Date | null;
  /** Callback when date changes */
  onChange: (date: string | null) => void;
  /** Callback when input loses focus (optional) */
  onBlur?: () => void;
  /** Label text (optional, for form usage) */
  label?: string;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled dates (function or array) */
  disabled?: ((date: Date) => boolean) | Date[];
  /** Show clear button */
  showClear?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Disabled state */
  isDisabled?: boolean;
  /** Custom className for container */
  className?: string;
  /** Custom className for button */
  buttonClassName?: string;
  /** Date format for display (default: 'MMM dd, yyyy') */
  displayFormat?: string;
  /** Variant style: 'default' | 'filter' | 'form' */
  variant?: 'default' | 'filter' | 'form';
  /** Size: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** ID for accessibility */
  id?: string;
  /** Name for form fields */
  name?: string;
  /** Focus error refs for scroll to error */
  focusErrorFieldName?: string;
  focusErrorRefs?: React.RefObject<Record<string, HTMLElement | null>>;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onBlur,
  label,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled,
  showClear = false,
  required = false,
  error,
  isDisabled = false,
  className = '',
  buttonClassName = '',
  displayFormat = 'MMM dd, yyyy',
  variant = 'default',
  size = 'md',
  id,
  name,
  focusErrorFieldName,
  focusErrorRefs,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Register for error scrolling
  useEffect(() => {
    if (focusErrorFieldName && focusErrorRefs?.current && buttonRef.current) {
      focusErrorRefs.current[focusErrorFieldName] = buttonRef.current;
      return () => {
        if (focusErrorRefs.current && focusErrorFieldName) {
          delete focusErrorRefs.current[focusErrorFieldName];
        }
      };
    }
  }, [focusErrorFieldName, focusErrorRefs]);

  // Convert value to Date object
  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : undefined;

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);

      // Trigger onBlur after selection if provided
      if (onBlur) {
        onBlur();
      }
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);

    // Trigger onBlur after clearing if provided
    if (onBlur) {
      onBlur();
    }
  };

  // The calendar is rendered through a portal (see PopoverContent) so it can float
  // above sidebars/overflow-hidden ancestors instead of being clipped by them.
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onBlur) {
      onBlur();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-xs px-3 py-1',
    md: 'h-[38px] text-sm px-3 py-2',
    lg: 'h-[45px] text-base px-4 py-2.5',
  };

  // Variant classes
  const variantClasses = {
    default: 'border border-border rounded-lg bg-background hover:bg-muted/50',
    filter: 'border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600',
    form: 'border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/50',
  };

  // Build disabled configuration
  let disabledConfig: any = undefined;
  if (disabled) {
    disabledConfig = disabled;
  } else {
    const restrictions: any = {};
    if (minDate) restrictions.before = minDate;
    if (maxDate) restrictions.after = maxDate;
    if (Object.keys(restrictions).length > 0) {
      disabledConfig = restrictions;
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Label (for form variant) */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            ref={buttonRef}
            id={id}
            name={name}
            type="button"
            disabled={isDisabled}
            className={`
              ${sizeClasses[size]}
              ${variantClasses[variant]}
              ${error ? 'border-red-500' : ''}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              focus:outline-none
              transition-colors
              w-full
              flex items-center justify-between
              text-left
              ${buttonClassName}
            `}
          >
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span
                className={
                  value
                    ? 'text-foreground font-medium truncate'
                    : 'text-foreground truncate'
                }
              >
                {value ? format(dateValue!, displayFormat) : placeholder}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {showClear && value && !isDisabled && (
                <X
                  className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleClear}
                />
              )}
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
        </PopoverTrigger>

        {/* FIX: Add sideOffset={0} and alignOffset={0} to prevent jump */}
        <PopoverContent
          align={variant === 'filter' ? 'end' : 'start'}
          className="w-auto p-3 z-[9999]"
          sideOffset={4}
          alignOffset={0}
          // Prevent the popover from being affected by scroll containers
          avoidCollisions={true}
          collisionBoundary="viewport"
        >
          <DayPicker
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={disabledConfig}
            showOutsideDays
            className="rdp-custom"
            // Add this to prevent month navigation from causing scroll jump
            modifiers={{
              today: new Date(),
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Custom styles for react-day-picker */}
      <style>{`
        .rdp-custom {
          --rdp-cell-size: 40px;
          --rdp-accent-color: hsl(var(--primary));
          --rdp-background-color: hsl(var(--primary) / 0.1);
          margin: 0;
        }

        .rdp-custom .rdp-months {
          justify-content: center;
        }

        .rdp-custom .rdp-month {
          margin: 0;
        }

        .rdp-custom .rdp-caption {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1rem;
          font-weight: 600;
          position: relative;
        }

        .rdp-custom .rdp-caption_label {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .rdp-custom .rdp-nav {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          gap: 0.25rem;
        }

        .rdp-custom .rdp-nav_button {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: none;
          background-color: transparent;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rdp-custom .rdp-nav_button:hover {
          background-color: hsl(var(--muted));
        }

        .rdp-custom .rdp-head_cell {
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          padding: 0.5rem;
        }

        .rdp-custom .rdp-cell {
          padding: 2px;
        }

        .rdp-custom .rdp-button {
          width: 36px;
          height: 36px;
          border-radius: 4px;
          border: none;
          background-color: transparent;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .rdp-custom .rdp-button:hover {
          background-color: hsl(var(--muted));
        }

        .rdp-custom .rdp-day_selected {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-weight: 600;
        }

        .rdp-custom .rdp-day_selected:hover {
          background-color: hsl(var(--primary) / 0.9);
        }

        .rdp-custom .rdp-day_today {
          font-weight: 600;
          color: hsl(var(--primary));
          background-color: hsl(var(--primary) / 0.1);
        }

        .rdp-custom .rdp-day_outside {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }

        .rdp-custom .rdp-day_disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Fix for popover inside scroll containers */
        .rdp-custom .rdp-month_dropdown,
        .rdp-custom .rdp-year_dropdown {
          position: relative !important;
          z-index: 10000 !important;
        }
      `}</style>
    </div>
  );
};

export default DatePicker;