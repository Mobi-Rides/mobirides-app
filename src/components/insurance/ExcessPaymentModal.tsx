import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBookingPayment } from "@/hooks/useBookingPayment";
import { UnifiedPriceSummary } from "../booking/UnifiedPriceSummary";
import { PaymentMethodSelector, PaymentMethodType } from "../booking/PaymentMethodSelector";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExcessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  amount: number;
  onSuccess: () => void;
}

export const ExcessPaymentModal: React.FC<ExcessPaymentModalProps> = ({
  isOpen,
  onClose,
  claimId,
  amount,
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reusing the hook for UI state, but custom implementation for excess
  const { initiatePayment, processingStep } = useBookingPayment();

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // Simulate Payment Process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update Claim
      await supabase
        .from('insurance_claims')
        .update({
           excess_paid: amount,
           excess_payment_date: new Date().toISOString(),
           excess_amount_paid: amount
        })
        .eq('id', claimId);

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pay Insurance Excess</DialogTitle>
          <DialogDescription>
            An excess payment is required to process your claim.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/30 p-4 rounded-lg flex justify-between items-center">
            <span className="font-medium">Excess Amount Due</span>
            <span className="text-xl font-bold">BWP {amount.toFixed(2)}</span>
          </div>

          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelect={setSelectedMethod}
          />

          <Button 
            className="w-full" 
            onClick={handlePay}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay BWP {amount.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
