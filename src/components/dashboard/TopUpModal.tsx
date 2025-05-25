
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, AlertCircle, CheckCircle, Wallet } from "lucide-react";
import { mockPaymentService } from "@/services/mockPaymentService";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

type ProcessingStep = 'validating' | 'processing_payment' | 'updating_wallet' | 'completed' | 'error';

export const TopUpModal = ({ isOpen, onClose, onSuccess, currentBalance }: TopUpModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('validating');
  const [error, setError] = useState<string>("");

  const presetAmounts = mockPaymentService.getPresetAmounts();
  const paymentMethods = mockPaymentService.getAvailablePaymentMethods();

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
    setError("");
  };

  const getStepMessage = (step: ProcessingStep): string => {
    switch (step) {
      case 'validating':
        return 'Validating payment details...';
      case 'processing_payment':
        return 'Processing payment...';
      case 'updating_wallet':
        return 'Updating wallet balance...';
      case 'completed':
        return 'Top-up completed successfully!';
      case 'error':
        return 'An error occurred';
      default:
        return 'Processing...';
    }
  };

  const validateAmount = (topUpAmount: number): string | null => {
    if (!topUpAmount || topUpAmount <= 0) {
      return "Please enter a valid amount";
    }
    if (topUpAmount < 10) {
      return "Minimum top-up amount is P10.00";
    }
    if (topUpAmount > 50000) {
      return "Maximum top-up amount is P50,000.00";
    }
    return null;
  };

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);
    
    console.log("TopUpModal: Starting top-up process", { 
      topUpAmount, 
      paymentMethod, 
      currentBalance 
    });
    
    setError("");
    setIsProcessing(true);
    setProcessingStep('validating');

    try {
      // Validation
      const validationError = validateAmount(topUpAmount);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        return;
      }

      if (!paymentMethod) {
        const error = "Please select a payment method";
        setError(error);
        toast.error(error);
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("TopUpModal: User authentication error:", userError);
        const error = "User not authenticated. Please log in and try again.";
        setError(error);
        toast.error(error);
        return;
      }

      console.log("TopUpModal: User authenticated, proceeding with payment");

      // Process payment
      setProcessingStep('processing_payment');
      console.log("TopUpModal: Processing mock payment...");
      
      const paymentResult = await mockPaymentService.processPayment({
        amount: topUpAmount,
        payment_method: paymentMethod
      });

      console.log("TopUpModal: Payment result:", paymentResult);

      if (!paymentResult.success) {
        const error = paymentResult.error_message || "Payment failed";
        setError(error);
        toast.error(error);
        setProcessingStep('error');
        return;
      }

      // Update wallet
      setProcessingStep('updating_wallet');
      console.log("TopUpModal: Adding funds to wallet for user:", user.id);
      
      const success = await walletService.topUpWallet(user.id, {
        amount: topUpAmount,
        payment_method: paymentMethod,
        payment_reference: paymentResult.payment_reference
      });

      if (success) {
        setProcessingStep('completed');
        console.log("TopUpModal: Top-up successful, calling onSuccess");
        
        // Show success state briefly before closing
        setTimeout(() => {
          onSuccess();
          onClose();
          setAmount("");
          setPaymentMethod("");
          setProcessingStep('validating');
        }, 1500);
      } else {
        const error = "Failed to update wallet balance. Please contact support.";
        setError(error);
        toast.error(error);
        setProcessingStep('error');
      }
    } catch (error) {
      console.error("TopUpModal: Unexpected error:", error);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setProcessingStep('error');
    } finally {
      if (processingStep !== 'completed') {
        setIsProcessing(false);
      }
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setAmount("");
      setPaymentMethod("");
      setError("");
      setProcessingStep('validating');
    }
  };

  const newBalance = currentBalance + (parseFloat(amount) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-lg font-semibold">P{currentBalance.toFixed(2)}</p>
              </div>
              {amount && !error && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">New Balance</p>
                  <p className="text-lg font-semibold text-green-600">P{newBalance.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <Alert>
              <div className="flex items-center gap-2">
                {processingStep === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <AlertDescription>{getStepMessage(processingStep)}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Add (BWP)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              min="10"
              max="50000"
              step="0.01"
              disabled={isProcessing}
              className={error && error.includes("amount") ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Min: P10.00 • Max: P50,000.00
            </p>
          </div>

          <div className="space-y-2">
            <Label>Quick Select (BWP)</Label>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  variant={amount === presetAmount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetAmount(presetAmount)}
                  className="h-8"
                  disabled={isProcessing}
                >
                  P{presetAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value) => {
                setPaymentMethod(value);
                setError("");
              }} 
              disabled={isProcessing}
            >
              <SelectTrigger className={error && error.includes("payment") ? "border-red-500" : ""}>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  🔒 This is a mock payment system for demo purposes. 
                  No real money will be charged.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1" 
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTopUp} 
              disabled={isProcessing || !amount || !paymentMethod || processingStep === 'completed'}
              className="flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {processingStep === 'completed' ? 'Success!' : 'Processing...'}
                </div>
              ) : (
                `Top Up P${amount || '0.00'}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
