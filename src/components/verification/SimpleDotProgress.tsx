import React from "react";
import { VerificationStep } from "@/types/verification";

type Props = {
  currentStep: VerificationStep;
  steps: VerificationStep[];
  onStepClick?: (step: VerificationStep) => void;
  canNavigateToStep?: (step: VerificationStep) => boolean;
};

export const SimpleDotProgress: React.FC<Props> = ({ currentStep, steps, onStepClick, canNavigateToStep }) => {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      {steps.map((step, index) => {
        const isCurrent = step === currentStep;
        const canNavigate = canNavigateToStep ? canNavigateToStep(step) : true;
        const base = "h-3 w-3 rounded-full";
        const color = isCurrent ? "bg-blue-600" : "bg-gray-400";
        return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              aria-label={`Go to step ${index + 1}`}
              className={`${base} ${color} ${!canNavigate && !isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => canNavigate && onStepClick && onStepClick(step)}
              disabled={!canNavigate && !isCurrent}
            />
            {index < steps.length - 1 && <div className="w-8 h-0.5 mx-2 bg-gray-500" />}
          </div>
        );
      })}
    </div>
  );
};

export default SimpleDotProgress;