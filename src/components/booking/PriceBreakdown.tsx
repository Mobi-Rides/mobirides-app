import { PricingCalculation } from "@/types/pricing";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  calculation: PricingCalculation | null;
  basePrice: number;
};

export const PriceBreakdown = ({ calculation, basePrice }: Props) => {
  if (!calculation || calculation.applied_rules.length === 0) return null;

  const hasSavings = calculation.savings && calculation.savings > 0;
  const hasPremium = calculation.premium && calculation.premium > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="font-medium">Price breakdown</h4>
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
          Dynamic Pricing
        </Badge>
      </div>
      <div className="text-sm space-y-1 p-4 bg-primary/5 rounded-md">
        <div className="flex justify-between text-muted-foreground">
          <span>Base price</span>
          <span>BWP {basePrice.toFixed(2)}</span>
        </div>
        {calculation.applied_rules.map(r => (
          <div key={r.rule_id} className="flex justify-between items-center">
            <span className="text-muted-foreground">{r.description}</span>
            <span className={r.multiplier < 1 ? "text-green-600" : r.multiplier > 1 ? "text-orange-600" : ""}>
              {r.multiplier < 1 ? "-" : r.multiplier > 1 ? "+" : ""}
              {Math.abs((r.multiplier - 1) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
          <span className="font-medium text-primary">Final price</span>
          <div className="flex items-center gap-2">
            {hasSavings && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Save BWP {calculation.savings?.toFixed(2)}
              </span>
            )}
            {hasPremium && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +BWP {calculation.premium?.toFixed(2)}
              </span>
            )}
            <span className="font-medium text-primary">BWP {calculation.final_price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

