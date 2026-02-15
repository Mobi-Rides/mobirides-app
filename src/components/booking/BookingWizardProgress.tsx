import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BookingWizardStepProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const BookingWizardProgress: React.FC<BookingWizardStepProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="px-4 pt-4 pb-2">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                    !isCompleted && !isActive && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center max-w-[60px]",
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {stepLabels[i]}
                </span>
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 mb-4 transition-colors",
                    stepNum < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
