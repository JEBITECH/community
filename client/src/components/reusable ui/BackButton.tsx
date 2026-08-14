import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const BackButton = ({ to, label = "Back to Units" }: { to: string; label?: string }) => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};