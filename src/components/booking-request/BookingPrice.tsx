
import { CreditCard, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BookingPriceProps {
  totalPrice: number;
}

export const BookingPrice = ({ totalPrice }: BookingPriceProps) => {
  // Constants for Host View - These should match DB or Config
  const COMMISSION_RATE = 0.15; // 15%
  const commissionAmount = totalPrice * COMMISSION_RATE;
  const hostEarnings = totalPrice - commissionAmount;

  return (
    <div className="bg-card rounded-lg p-4 border space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
            <CreditCard className="h-4 w-4 text-primary" />
          </span>
          <p className="font-semibold">Total Price (Renter Pays)</p>
        </div>
        <p className="text-xl font-bold">BWP {totalPrice.toFixed(2)}</p>
      </div>

      <div className="pt-2 border-t space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Platform Commission (15%)</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Includes platform service fee and payment processing costs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>- BWP {commissionAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between font-medium text-green-600 dark:text-green-400">
          <span>Your Net Earnings</span>
          <span>BWP {hostEarnings.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
