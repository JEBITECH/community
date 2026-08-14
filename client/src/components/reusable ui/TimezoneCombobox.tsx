import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

interface TimezoneComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimezoneCombobox({ value, onChange, disabled = false, placeholder = "Select timezone..." }: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate timezone options with grouping
  const timezoneOptions = useMemo(() => {
    const timeZones = Intl.supportedValuesOf("timeZone");
    
    return timeZones.map((tz) => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "longOffset",
      });

      const parts = formatter.formatToParts(new Date());
      const offsetPart = parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
      const offset = offsetPart.replace("GMT", "UTC");

      // Extract region and city
      const [region, ...cityParts] = tz.split("/");
      const city = cityParts.join(", ").replace(/_/g, " ");

      return {
        value: tz,
        label: `(${offset}) ${city || region}`,
        offset,
        region: region || "Other",
      };
    }).sort((a, b) => {
      // Sort by offset first, then by label
      if (a.offset !== b.offset) {
        return a.offset.localeCompare(b.offset);
      }
      return a.label.localeCompare(b.label);
    });
  }, []);

  // Group timezones by region
  const groupedTimezones = useMemo(() => {
    const groups: Record<string, TimezoneOption[]> = {};
    
    timezoneOptions.forEach((tz) => {
      if (!groups[tz.region]) {
        groups[tz.region] = [];
      }
      groups[tz.region].push(tz);
    });

    return groups;
  }, [timezoneOptions]);

  // Filter timezones based on search
  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return groupedTimezones;

    const filtered: Record<string, TimezoneOption[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(groupedTimezones).forEach(([region, zones]) => {
      const matchingZones = zones.filter(
        (tz) =>
          tz.label.toLowerCase().includes(query) ||
          tz.value.toLowerCase().includes(query) ||
          tz.offset.toLowerCase().includes(query)
      );

      if (matchingZones.length > 0) {
        filtered[region] = matchingZones;
      }
    });

    return filtered;
  }, [groupedTimezones, searchQuery]);

  const selectedTimezone = timezoneOptions.find((tz) => tz.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-9 font-normal"
        >
          <span className="truncate">
            {selectedTimezone ? selectedTimezone.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search timezone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            {Object.entries(filteredTimezones).map(([region, zones]) => (
              <CommandGroup key={region} heading={region}>
                {zones.map((tz) => (
                  <CommandItem
                    key={tz.value}
                    value={tz.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === tz.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{tz.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
