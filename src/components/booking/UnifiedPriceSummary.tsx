import React from 'react';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { PricingCalculation } from "@/types/pricing";

interface UnifiedPriceSummaryProps {
  // Base calculation
  basePrice: number;              // price_per_day * days
  pricePerDay: number;
  numberOfDays: number;
  
  // Dynamic pricing
  dynamicPricing?: PricingCalculation;
  
  // Insurance
  insurancePremium: number;
  insurancePackageName?: string;
  
  // Discounts
  discountAmount: number;
  promoCode?: string;
  
  // Display options
  variant?: 'full' | 'compact' | 'receipt';
  showBreakdown?: boolean;
  className?: string;
  isPaid?: boolean;
  destinationType?: string;
}

export const UnifiedPriceSummary: React.FC<UnifiedPriceSummaryProps> = ({
  basePrice,
  pricePerDay,
  numberOfDays,
  dynamicPricing,
  insurancePremium,
  insurancePackageName,
  discountAmount,
  promoCode,
  variant = 'full',
  showBreakdown = true,
  className,
  isPaid = false,
  destinationType
}) => {
  // Calculate rental subtotal with dynamic pricing
  const rentalSubtotal = dynamicPricing?.final_price ?? basePrice;
  
  // Calculate grand total
  const grandTotal = rentalSubtotal + insurancePremium - discountAmount;
  
  // Format currency helper
  const formatCurrency = (amount: number) => `BWP ${amount.toFixed(2)}`;

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-col items-end", className)}>
        <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
        {showBreakdown && (
           <span className="text-xs text-muted-foreground">
             {numberOfDays} days • {insurancePremium > 0 ? '+ Insurance' : 'Rental only'}
           </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        {/* Base Rental */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Rental ({numberOfDays} {numberOfDays === 1 ? 'day' : 'days'} × {formatCurrency(pricePerDay)})
          </span>
          <span>{formatCurrency(basePrice)}</span>
        </div>

        {/* Dynamic Pricing Adjustments */}
        {dynamicPricing?.is_dynamic && dynamicPricing.applied_rules && dynamicPricing.applied_rules.length > 0 ? (
          <div className="space-y-1">
            {dynamicPricing.applied_rules.map((rule, idx) => (
              <div key={rule.rule_id || idx} className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                <span>{rule.description}</span>
                <span>
                  {/* Since we don't have individual amounts, we show the multiplier or just the total below if multiple */}
                  {dynamicPricing.applied_rules!.length === 1 ? (
                    <>
                      {rule.multiplier > 1 ? '+' : ''}
                      {formatCurrency(dynamicPricing.final_price - basePrice)}
                    </>
                  ) : (
                    `${rule.multiplier > 1 ? '+' : ''}${Math.round((rule.multiplier - 1) * 100)}%`
                  )}
                </span>
              </div>
            ))}
            {dynamicPricing.applied_rules.length > 1 && (
              <div className="flex justify-between text-xs font-medium text-amber-700 dark:text-amber-300 pt-1">
                <span>Total Dynamic Adjustment</span>
                <span>
                  {dynamicPricing.final_price > basePrice ? '+' : ''}
                  {formatCurrency(dynamicPricing.final_price - basePrice)}
                </span>
              </div>
            )}
          </div>
        ) : dynamicPricing?.is_dynamic && dynamicPricing.final_price !== basePrice && (
          <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
            <span>Adjustment</span>
            <span>
              {dynamicPricing.final_price > basePrice ? '+' : ''}
              {formatCurrency(dynamicPricing.final_price - basePrice)}
            </span>
          </div>
        )}

        {/* Rental Subtotal (only show if adjustments exist) */}
        {(dynamicPricing?.is_dynamic || discountAmount > 0 || insurancePremium > 0) && (
          <>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-medium">
              <span>Rental Subtotal</span>
              <span>{formatCurrency(rentalSubtotal)}</span>
            </div>
          </>
        )}

        {/* Insurance */}
        {insurancePremium > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {insurancePackageName || "Insurance Premium"}
            </span>
            <span>+{formatCurrency(insurancePremium)}</span>
          </div>
        )}

        {/* Discounts */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Discount {promoCode ? `(${promoCode})` : ''}</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Grand Total */}
      <div className="flex justify-between items-center">
        <span className="font-semibold">{isPaid ? 'Total Paid' : 'Total to Pay'}</span>
        <span className={cn(
          "text-xl font-bold", 
          isPaid ? "text-green-600 dark:text-green-400" : "text-primary"
        )}>
          {formatCurrency(grandTotal)}
        </span>
      </div>
      
      {variant === 'receipt' && (
         <div className="text-xs text-muted-foreground text-center pt-2">
            Includes all taxes and fees
         </div>
      )}
    </div>
  );
};
