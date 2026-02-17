
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedPriceSummary } from "../booking/UnifiedPriceSummary";

interface RentalPaymentDetailsProps {
  pricePerDay: number;
  durationDays: number;
  totalPrice: number;
  // Extended fields
  baseRentalPrice?: number;
  insurancePremium?: number;
  discountAmount?: number;
  dynamicMultiplier?: number;
  isPaid?: boolean;
  insurancePackageName?: string;
}

export const RentalPaymentDetails = ({ 
  pricePerDay, 
  durationDays, 
  totalPrice,
  baseRentalPrice,
  insurancePremium,
  discountAmount,
  dynamicMultiplier,
  isPaid,
  insurancePackageName
}: RentalPaymentDetailsProps) => {
  
  // Backwards compatibility calculation if fields are missing
  const basePrice = baseRentalPrice ?? (pricePerDay * durationDays);
  
  // Construct dynamic pricing object if multiplier exists and isn't 1
  const dynamicPricing = (dynamicMultiplier && dynamicMultiplier !== 1) ? {
    is_dynamic: true,
    final_price: basePrice * dynamicMultiplier,
    original_price: basePrice,
    multiplier: dynamicMultiplier
  } : undefined;

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <CreditCard className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedPriceSummary
          basePrice={basePrice}
          pricePerDay={pricePerDay}
          numberOfDays={durationDays}
          dynamicPricing={dynamicPricing}
          insurancePremium={insurancePremium || 0}
          insurancePackageName={insurancePackageName}
          discountAmount={discountAmount || 0}
          variant="full"
          isPaid={isPaid}
        />
      </CardContent>
    </Card>
  );
};
