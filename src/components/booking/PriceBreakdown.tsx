import { PricingCalculation } from "@/types/pricing";

type Props = {
  calculation: PricingCalculation | null;
  basePrice: number;
};

export const PriceBreakdown = ({ calculation, basePrice }: Props) => {
  if (!calculation) return null;
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Price breakdown</h4>
      <div className="text-sm space-y-1 p-4 bg-primary/5 rounded-md">
        <div className="flex justify-between">
          <span>Base</span>
          <span>BWP {basePrice.toFixed(2)}</span>
        </div>
        {calculation.applied_rules.map(r => (
          <div key={r.rule_id} className="flex justify-between">
            <span>{r.description}</span>
            <span>x{r.multiplier.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 mt-2 flex justify-between">
          <span className="font-medium text-primary">Total</span>
          <span className="font-medium text-primary">BWP {calculation.final_price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

