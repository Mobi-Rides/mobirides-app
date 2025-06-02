
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

  return (
    <div className="space-y-4 p-6 border-t">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
          <Wallet className="h-4 w-4 text-primary" />
        </span>
        Wallet & Commission
      </h2>
      
      <WalletBalanceIndicator 
        bookingTotal={bookingTotal}
        showCommissionBreakdown={true}
      />

      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-800 dark:text-blue-200">
                Commission Payment
              </h3>
              <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <p>Total Booking: P{bookingTotal.toFixed(2)}</p>
                <p>Platform Commission (15%): P{commissionAmount.toFixed(2)}</p>
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  Will be deducted from your wallet balance
                </p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                You'll receive the full rental amount (P{bookingTotal.toFixed(2)}) while commission is paid from your wallet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!canApproveBooking && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need sufficient wallet balance to cover the P{commissionAmount.toFixed(2)} commission plus P50 minimum balance to accept this booking.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
