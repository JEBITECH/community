import React from "react";
import { Input } from "@/components/ui/input";
import FormLabel from "./AppFormLabel";
import { cn } from "@/lib/utils"; // optional helper for combining classes

export interface FormInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  icon?: React.ElementType; // e.g. Mail, Phone, User etc.
  error?: string;
  disabled?: boolean;
  type?: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
}

const FormInput: React.FC<FormInputProps> = ({ label, required, placeholder, value, onChange, onBlur, icon: Icon, error, disabled, type = "text", className, maxLength }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <FormLabel label={label || ""} required={required} />

      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />}

        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(Icon ? "pl-10" : "", "h-9 text-sm border-border/60 focus:border-primary/50", className)}
        />
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1">{error && <p className="text-destructive text-sm">{error}</p>}</div>
        {maxLength && value && (
          <p className={cn("text-xs ml-2 flex-shrink-0", value.length >= maxLength ? "text-destructive font-medium" : "text-muted-foreground")}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormInput;
