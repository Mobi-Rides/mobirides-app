import React from "react";
import { VerificationStep } from "@/types/verification";

type Props = {
  currentStep: VerificationStep;
  steps: VerificationStep[];
  onStepClick?: (step: VerificationStep) => void;
  canNavigateToStep?: (step: VerificationStep) => boolean;
};

// 3-Step Flow Labels
const STEP_LABELS: Record<string, string> = {
  [VerificationStep.PERSONAL_INFO]: "Personal Info",
  [VerificationStep.DOCUMENT_UPLOAD]: "Documents",
  [VerificationStep.REVIEW_SUBMIT]: "Review & Submit",
};

export const SimpleDotProgress: React.FC<Props> = ({ currentStep, steps, onStepClick, canNavigateToStep }) => {
  // Filter to only show core 3 steps
  const coreSteps = steps.filter(step => 
    step === VerificationStep.PERSONAL_INFO ||
    step === VerificationStep.DOCUMENT_UPLOAD ||
    step === VerificationStep.REVIEW_SUBMIT
  );

  return (
    <div className="flex flex-col items-center gap-6 my-6">
      <div className="flex items-center justify-center gap-4">
        {coreSteps.map((step, index) => {
          const isCurrent = step === currentStep;
          const canNavigate = canNavigateToStep ? canNavigateToStep(step) : true;
          const base = "h-3 w-3 rounded-full transition-all";
          const color = isCurrent ? "bg-primary scale-125" : "bg-muted-foreground/40";
          
          return (
            <div key={step} className="flex items-center">
              <button
                type="button"
                aria-label={`Go to ${STEP_LABELS[step]}`}
                className={`${base} ${color} ${!canNavigate && !isCurrent ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                onClick={() => canNavigate && onStepClick && onStepClick(step)}
                disabled={!canNavigate && !isCurrent}
              />
              {index < coreSteps.length - 1 && (
                <div className="w-12 h-0.5 mx-2 bg-muted-foreground/20" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Step label */}
      <div className="text-sm font-medium text-muted-foreground">
        {STEP_LABELS[currentStep] || currentStep}
      </div>
    </div>
  );
};

export default SimpleDotProgress;