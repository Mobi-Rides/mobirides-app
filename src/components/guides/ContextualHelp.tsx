import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ContextualHelpProps {
  helpText: string;
  guideSection: string;
  role?: "renter" | "host";
  side?: "top" | "bottom" | "left" | "right";
}

export const ContextualHelp = ({
  helpText,
  guideSection,
  role = "renter",
  side = "top",
}: ContextualHelpProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full h-4 w-4 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Help"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        className="w-64 p-3 text-sm"
        align="center"
      >
        <p className="text-muted-foreground leading-relaxed">{helpText}</p>
        <Link
          to={`/help/${role}/${guideSection}`}
          className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
        >
          Learn more →
        </Link>
      </PopoverContent>
    </Popover>
  );
};
