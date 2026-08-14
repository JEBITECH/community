import * as React from "react";
import { format, setMonth, setYear, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "./date-picker.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  dateFormat?: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  showYearDropdown?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  disabled = false,
  className,
  fromYear = 2000,
  toYear = new Date().getFullYear() + 10,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [displayMonth, setDisplayMonth] = React.useState(date || new Date());
  const [pickerView, setPickerView] = React.useState<'calendar' | 'month' | 'year'>('calendar');
  const [isFocused, setIsFocused] = React.useState(false);
  const yearListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isFocused) {
      if (date) {
        setInputValue(format(date, dateFormat));
      } else {
        setInputValue("");
      }
    }
  }, [date, dateFormat, isFocused]);

  React.useEffect(() => {
    if (date) setDisplayMonth(date);
  }, [date]);

  // Scroll to selected year when year picker opens
  React.useEffect(() => {
    if (pickerView === 'year' && yearListRef.current) {
      const selected = yearListRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'center' });
      }
    }
  }, [pickerView]);

  // Reset view when popover closes
  React.useEffect(() => {
    if (!open) setPickerView('calendar');
  }, [open]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (inputValue.trim() === '') {
      onDateChange?.(undefined);
      return;
    }
    // Try configured format first, then fallback to native Date parsing
    let parsed = parse(inputValue, dateFormat, new Date());
    if (!isValid(parsed)) {
      parsed = new Date(inputValue);
    }
    if (isValid(parsed)) {
      onDateChange?.(parsed);
      setDisplayMonth(parsed);
    } else if (date) {
      setInputValue(format(date, dateFormat));
    } else {
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputBlur();
      setOpen(true);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    setDisplayMonth(setMonth(displayMonth, monthIndex));
    setPickerView('calendar');
  };

  const handleYearSelect = (year: number) => {
    setDisplayMonth(setYear(displayMonth, year));
    setPickerView('month');
  };

  const handlePrevMonth = () => {
    const prev = new Date(displayMonth);
    prev.setMonth(prev.getMonth() - 1);
    setDisplayMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(displayMonth);
    next.setMonth(next.getMonth() + 1);
    setDisplayMonth(next);
  };

  const years = React.useMemo(() => {
    const arr = [];
    for (let y = fromYear; y <= toYear; y++) arr.push(y);
    return arr;
  }, [fromYear, toYear]);

  // Convert dateFormat to placeholder hint (e.g., "MM/dd/yyyy" → "MM/DD/YYYY")
  const formatHint = dateFormat
    .replace(/yyyy/g, 'YYYY').replace(/yy/g, 'YY')
    .replace(/MM/g, 'MM').replace(/dd/g, 'DD')
    .replace(/PPP/g, 'MMM DD, YYYY');

  const displayPlaceholder = date ? '' : `${placeholder} (${formatHint})`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input value={inputValue} onChange={handleInputChange} onFocus={() => setIsFocused(true)} onBlur={handleInputBlur} onKeyDown={handleInputKeyDown} placeholder={displayPlaceholder} disabled={disabled} className={cn("pr-10", className)} />
          <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setOpen(!open)} disabled={disabled} type="button">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start" side="bottom" sideOffset={4} avoidCollisions={true}>
        <div className="p-3">
          {/* Month/year header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPickerView(pickerView === 'month' ? 'calendar' : 'month')}
                className={cn(
                  "text-sm font-semibold px-2 py-1 rounded-md transition-colors",
                  pickerView === 'month' ? "bg-primary/10 text-primary" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {MONTHS[displayMonth.getMonth()]}
              </button>
              <button
                type="button"
                onClick={() => setPickerView(pickerView === 'year' ? 'calendar' : 'year')}
                className={cn(
                  "text-sm font-semibold px-2 py-1 rounded-md transition-colors",
                  pickerView === 'year' ? "bg-primary/10 text-primary" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {displayMonth.getFullYear()}
              </button>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Fixed height container for all views */}
          <div className="h-[280px]">
            {/* Month grid picker */}
            {pickerView === 'month' && (
              <div className="grid grid-cols-3 gap-2 py-4 px-2">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthSelect(i)}
                    className={cn(
                      "px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                      displayMonth.getMonth() === i
                        ? "bg-primary text-white"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Year grid picker */}
            {pickerView === 'year' && (
              <div ref={yearListRef} className="grid grid-cols-4 gap-1.5 py-4 px-2 h-[280px] overflow-y-auto">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    data-selected={displayMonth.getFullYear() === y}
                    onClick={() => handleYearSelect(y)}
                    className={cn(
                      "px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      displayMonth.getFullYear() === y
                        ? "bg-primary text-white"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar */}
            {pickerView === 'calendar' && (
              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                showOutsideDays
                fixedWeeks
                className="rdp-months rdp-hide-caption"
                captionLayout="buttons"
                defaultMonth={date || new Date()}
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Preset date formats for common use cases
export const DateFormats = {
  SHORT: "MM/dd/yyyy",
  MEDIUM: "MMM dd, yyyy",
  LONG: "MMMM dd, yyyy",
  ISO: "yyyy-MM-dd",
  EUROPEAN: "dd/MM/yyyy",
  COMPACT: "MMddyy",
} as const;

export type DateFormat = (typeof DateFormats)[keyof typeof DateFormats];
