import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TruncatedTextProps = {
  text: string;
  maxWidth?: string;
  className?: string; // optional styling
};

export function TruncatedText({
  text,
  maxWidth = "max-w-[180px]",
  className = "",
}: TruncatedTextProps) {
  if (!text) return <span>-</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`truncate block cursor-pointer ${maxWidth} ${className}`}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-words">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}