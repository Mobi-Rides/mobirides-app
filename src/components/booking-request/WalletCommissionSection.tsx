
import { Wallet, AlertCircle, TrendingUp } from "lucide-react";
import { WalletBalanceIndicator } from "@/components/dashboard/WalletBalanceIndicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface WalletCommissionSectionProps {
  bookingTotal: number;
  canApproveBooking: boolean;
}

export const WalletCommissionSection = ({ 
  bookingTotal, 
  canApproveBooking 
}: WalletCommissionSectionProps) => {
  const commissionRate = 0.15; // 15%
  const commissionAmount = bookingTotal * commissionRate;
  const hostEarnings = bookingTotal - commissionAmount;

  return (
    <div className="space-y-4 p-6 border-t">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
          <Wallet className="h-4 w-4 text-primary" />
        </span>
        Wallet & Earnings
      </h2>
      
      <WalletBalanceIndicator 
        bookingTotal={bookingTotal}
        showCommissionBreakdown={true}
      />

      <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-green-800 dark:text-green-200">
                Your Earnings from this Rental
              </h3>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <p>Total Booking: P{bookingTotal.toFixed(2)}</p>
                <p>Platform Commission (15%): -P{commissionAmount.toFixed(2)}</p>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  You'll earn: P{hostEarnings.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Commission is deducted from rental earnings, not your wallet balance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!canApproveBooking && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need at least P50 in your wallet balance to accept booking requests. 
            Your wallet balance is used for qualification only - commissions are deducted from rental earnings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
