
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
  destinationType?: string;
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
  insurancePackageName,
  destinationType
}: RentalPaymentDetailsProps) => {
  
  // Backwards compatibility calculation if fields are missing
  const basePrice = baseRentalPrice ?? (pricePerDay * durationDays);
  
  // Derive multiplier from destination type if not explicitly provided
  const destinationMultiplier =
    dynamicMultiplier ??
    (destinationType === 'cross_border' ? 2.0 :
     destinationType === 'out_of_zone'  ? 1.5 : 1);

  // Construct dynamic pricing object if multiplier exists and isn't 1
  const dynamicPricing = (destinationMultiplier !== 1) ? {
    is_dynamic: true,
    final_price: basePrice * destinationMultiplier,
    original_price: basePrice,
    multiplier: destinationMultiplier,
    base_price: basePrice,
    total_multiplier: destinationMultiplier
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
          destinationType={destinationType}
          variant="full"
          isPaid={isPaid}
        />
      </CardContent>
    </Card>
  );
};
