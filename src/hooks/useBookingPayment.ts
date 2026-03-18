import { useState } from 'react';
import { mockBookingPaymentService, BookingPaymentRequest, BookingPaymentResult } from '../services/mockBookingPaymentService';
import { useToast } from './use-toast';
import { supabase } from "@/integrations/supabase/client";

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
        
        // DEV ONLY: Simulate Webhook Effect
        // In real app, webhook updates this. In dev, we do it manually to unblock flow.
        if (!result.requires_user_action) {
          // Use the centralized lifecycle service to handle status update and notifications
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
