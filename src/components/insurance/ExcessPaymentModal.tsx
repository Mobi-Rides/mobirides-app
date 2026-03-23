import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { PaymentMethodSelector, PaymentMethodType } from "../booking/PaymentMethodSelector";
import { Loader2 } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { useToast } from "../ui/use-toast";

interface ExcessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  bookingId: string;
  amount: number;
  onSuccess: () => void;
}

export const ExcessPaymentModal: React.FC<ExcessPaymentModalProps> = ({
  isOpen, onClose, claimId, bookingId, amount, onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: {
          booking_id: bookingId,
          payment_method: selectedMethod,
          // Signal this is an excess payment so the edge function can handle it differently
          payment_context: 'insurance_excess',
          excess_claim_id: claimId,
          excess_amount: amount,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success && !data?.redirect_url) throw new Error(data?.error || 'Payment failed');

      // If provider returns a redirect (e.g. PayGate), open it
      if (data.redirect_url) {
        window.open(data.redirect_url, '_blank');
        toast({ title: "Payment initiated", description: "Complete the payment in the opened window." });
        onClose();
        return;
      }

      // Direct success (Orange Money / wallet)
      await supabase
        .from('insurance_claims' as any)
        .update({
          excess_paid: amount,
          excess_payment_date: new Date().toISOString(),
        })
        .eq('id', claimId);

      toast({ title: "Excess paid", description: `BWP ${amount.toFixed(2)} excess payment processed.` });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
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

          <PaymentMethodSelector selectedMethod={selectedMethod} onSelect={setSelectedMethod} />

          <Button className="w-full" onClick={handlePay} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay BWP {amount.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
