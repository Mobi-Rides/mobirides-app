
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { mockPaymentService } from "@/services/mockPaymentService";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

export const TopUpModal = ({ isOpen, onClose, onSuccess, currentBalance }: TopUpModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const presetAmounts = mockPaymentService.getPresetAmounts();
  const paymentMethods = mockPaymentService.getAvailablePaymentMethods();

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);
    
    if (!topUpAmount || topUpAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process mock payment
      const paymentResult = await mockPaymentService.processPayment({
        amount: topUpAmount,
        payment_method: paymentMethod
      });

      if (!paymentResult.success) {
        toast.error(paymentResult.error_message || "Payment failed");
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // Add funds to wallet
      const success = await walletService.topUpWallet(user.id, {
        amount: topUpAmount,
        payment_method: paymentMethod,
        payment_reference: paymentResult.payment_reference
      });

      if (success) {
        onSuccess();
        setAmount("");
        setPaymentMethod("");
      }
    } catch (error) {
      console.error("Top-up error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-lg font-semibold">${currentBalance.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Add</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="10000"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetAmount(presetAmount)}
                  className="h-8"
                >
                  ${presetAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground text-center">
                🔒 This is a mock payment system for demo purposes. 
                No real money will be charged.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleTopUp} 
              disabled={isProcessing || !amount || !paymentMethod}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Top Up $${amount || '0.00'}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
