import { useState } from 'react';
import { mockBookingPaymentService, BookingPaymentRequest, BookingPaymentResult } from '../services/mockBookingPaymentService';
import { useToast } from './use-toast';
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCommissionRate } from '@/services/commission/commissionRates';

interface UseBookingPaymentOptions {
  onSuccess?: (result: BookingPaymentResult) => void;
  onError?: (error: string) => void;
}

interface UseBookingPaymentReturn {
  initiatePayment: (request: BookingPaymentRequest) => Promise<void>;
  isProcessing: boolean;
  processingStep: 'idle' | 'validating' | 'processing' | 'confirming' | 'complete' | 'error';
  error: string | null;
}

export const useBookingPayment = (options: UseBookingPaymentOptions = {}): UseBookingPaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<UseBookingPaymentReturn['processingStep']>('idle');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const initiatePayment = async (request: BookingPaymentRequest) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep('validating');

    try {
      // Step 1: Validation (Simulated)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStep('processing');
      
      // Step 2: Process Payment
      // In production, this would call an edge function (initiate-payment)
      // For dev/mock, we use the mock service
      const result = await mockBookingPaymentService.processPayment(request);

      if (result.success) {
        setProcessingStep('confirming');
        
        if (!result.requires_user_action) {
          // Record the payment transaction
          const { data: { user } } = await supabase.auth.getUser();
          const amount = request.grand_total;
          const commissionRate = await getCurrentCommissionRate();
          // Commission applies to rental portion only (not insurance premium)
          const rentalPortion = request.base_rental_price + request.dynamic_pricing_adjustment - request.discount_amount;
          const commission = rentalPortion * commissionRate;
          const hostEarnings = rentalPortion - commission;
          const { error: txnError } = await supabase
            .from('payment_transactions')
            .insert({
              booking_id: request.booking_id,
              user_id: user?.id,
              amount,
              currency: 'BWP',
              payment_method: request.payment_method,
              payment_provider: request.payment_method === 'card' ? 'PayU' : 'MobileMoney',
              status: 'completed',
              platform_commission: commission,
              host_earnings: hostEarnings,
              commission_rate: commissionRate,
              completed_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (txnError) throw new Error(`Failed to record payment transaction: ${txnError.message}`);

          const { error: earningsError } = await supabase.rpc('credit_pending_earnings', {
            p_booking_id: request.booking_id,
            p_host_earnings: hostEarnings,
            p_platform_commission: commission,
          });

          if (earningsError) throw new Error(`Failed to credit host earnings: ${earningsError.message}`);

          const { bookingLifecycle } = await import("@/services/bookingLifecycle");
          const updateResult = await bookingLifecycle.updateStatus(request.booking_id, 'confirmed');
          
          if (!updateResult.success) {
            console.error("Dev lifecycle update failed:", updateResult.error);
            throw new Error("Failed to update booking status");
          }
        }

        // Simulate confirmation delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProcessingStep('complete');
        
        if (result.requires_user_action) {
           toast({
             title: "Payment Initiated",
             description: "Please check your phone to complete the transaction.",
           });
        } else {
           toast({
             title: "Payment Successful",
             description: "Your booking has been confirmed.",
           });
        }

        options.onSuccess?.(result);
      } else {
        throw new Error(result.error_message || 'Payment failed');
      }
    } catch (err: any) {
      setProcessingStep('error');
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      options.onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
      // Reset step after delay if needed, or leave at complete/error
    }
  };

  return {
    initiatePayment,
    isProcessing,
    processingStep,
    error
  };
};
