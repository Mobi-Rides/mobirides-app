import { PricingCalculation } from "@/types/pricing";

type Props = {
  calculation: PricingCalculation | null;
  insurancePremium?: number;
  numberOfDays?: number;
};

export const InsuranceComparison = ({ calculation, insurancePremium = 0, numberOfDays = 1 }: Props) => {
  if (!calculation) return null;

  const baseRental = calculation.base_price * numberOfDays;
  const withInsurance = baseRental + insurancePremium;

  return (
    <div className="space-y-2 text-sm">
      <h4 className="font-medium">Cost Comparison</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 border rounded-md bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">Without Insurance</div>
          <div className="font-semibold">BWP {baseRental.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">No coverage</div>
        </div>
        <div className="p-3 border rounded-md bg-primary/5 border-primary/20">
          <div className="text-xs text-muted-foreground mb-1">With Insurance</div>
          <div className="font-semibold">BWP {withInsurance.toFixed(2)}</div>
          {insurancePremium > 0 && (
            <div className="text-xs text-primary">+BWP {insurancePremium.toFixed(2)} premium</div>
          )}
        </div>
      </div>
    </div>
  );
};
