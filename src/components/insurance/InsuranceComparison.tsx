import { PricingCalculation } from "@/types/pricing";

type Props = {
  calculation: PricingCalculation | null;
};

export const InsuranceComparison = ({ calculation }: Props) => {
  if (!calculation) return null;
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Comparison</h4>
      <div className="text-xs text-muted-foreground">
        Compare total with and without insurance in the summary.
      </div>
    </div>
  );
};

