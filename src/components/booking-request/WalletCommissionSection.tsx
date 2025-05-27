
import { Wallet, AlertCircle } from "lucide-react";
import { WalletBalanceIndicator } from "@/components/dashboard/WalletBalanceIndicator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WalletCommissionSectionProps {
  bookingTotal: number;
  canApproveBooking: boolean;
}

export const WalletCommissionSection = ({ 
  bookingTotal, 
  canApproveBooking 
}: WalletCommissionSectionProps) => {
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
      
      {!canApproveBooking && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need sufficient wallet balance to accept this booking. The platform commission will be deducted from your wallet when you approve the request.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
