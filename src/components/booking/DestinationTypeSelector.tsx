import { MapPin, Globe, Navigation } from "lucide-react";
import type { DestinationType } from "@/types/booking";

// Re-export for backward compatibility
export type { DestinationType };

interface DestinationOption {
  type: DestinationType;
  title: string;
  subtitle: string;
  surchargeLabel: string;
  surchargeColor: string;
  icon: React.ReactNode;
}

const OPTIONS: DestinationOption[] = [
  {
    type: "local",
    title: "Local Trip",
    subtitle: "Within 90km of pickup",
    surchargeLabel: "No surcharge",
    surchargeColor: "text-green-600",
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    type: "out_of_zone",
    title: "Out of Zone",
    subtitle: "Beyond 90km from pickup",
    surchargeLabel: "+50%",
    surchargeColor: "text-orange-500",
    icon: <Navigation className="h-4 w-4" />,
  },
  {
    type: "cross_border",
    title: "Cross-Border",
    subtitle: "Traveling to another country",
    surchargeLabel: "+100%",
    surchargeColor: "text-orange-500",
    icon: <Globe className="h-4 w-4" />,
  },
];

interface DestinationTypeSelectorProps {
  selectedType: DestinationType;
  onSelect: (type: DestinationType) => void;
}

export const DestinationTypeSelector = ({
  selectedType,
  onSelect,
}: DestinationTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        Where are you heading?
      </p>
      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const isSelected = selectedType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onSelect(option.type)}
              className={`w-full text-left border rounded-lg p-4 transition-colors flex items-start gap-3 ${isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
                }`}
            >
              {/* Radio indicator */}
              <div
                className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-primary" : "border-muted-foreground/40"
                  }`}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{option.icon}</span>
                  <span className="text-sm font-medium">{option.title}</span>
                  <span className={`text-xs font-medium ml-auto ${option.surchargeColor}`}>
                    {option.surchargeLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                  {option.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
