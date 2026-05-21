import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const initiatePayment = async (request: BookingPaymentRequest) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep('validating');

    try {
      setProcessingStep('processing');
      
      const { data, error: functionError } = await supabase.functions.invoke('initiate-payment', {
        body: {
          booking_id: request.booking_id,
          payment_method: request.payment_method,
          // Route to our new return page
          success_url: `${window.location.origin}/payment/return`,
          cancel_url: `${window.location.origin}/rental-details/${request.booking_id}`
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Payment initiation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.paymentUrl) {
        setProcessingStep('confirming');

        // Use SPA navigation for same-origin URLs to preserve React state.
        // External gateway URLs (e.g. PayGate) require a hard redirect.
        const paymentUrl = new URL(data.paymentUrl, window.location.origin);
        if (paymentUrl.origin === window.location.origin) {
          navigate(paymentUrl.pathname + paymentUrl.search + paymentUrl.hash);
        } else {
          window.location.href = data.paymentUrl;
        }
      } else {
        throw new Error('No payment URL returned from provider');
      }

    } catch (err: unknown) {
      setProcessingStep('error');
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      options.onError?.(errorMessage);
      setIsProcessing(false);
    }
  };

  return {
    initiatePayment,
    isProcessing,
    processingStep,
    error
  };
};
