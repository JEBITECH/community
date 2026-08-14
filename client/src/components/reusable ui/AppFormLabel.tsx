import React from "react";

interface FormLabelProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ label, required = false, className }) => {
  return (
     <label className={`text-sm font-medium text-gray-700 ${className}`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
};

export default FormLabel;
