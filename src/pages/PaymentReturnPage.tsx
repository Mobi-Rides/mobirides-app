import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transaction_id");
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'not_found'>('loading');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isEft, setIsEft] = useState(false);
  const MAX_ATTEMPTS = 15; // Max 30 seconds of polling (15 * 2s)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let attempts = 0;

    if (!transactionId) {
      setStatus('not_found');
      return;
    }

    const checkStatus = async () => {
      if (cancelled) return;

      if (attempts >= MAX_ATTEMPTS) {
        console.error("Payment status polling timeout reached");
        setStatus('failed');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('query-payment', {
          body: { payment_transaction_id: transactionId }
        });

        if (error || data?.error) {
          throw new Error(error?.message || data?.error || 'Query failed');
        }

        setBookingId(data.booking_id);
        if (data.payment_method === 'eft') {
          setIsEft(true);
        }
        
        if (data.status === 'completed') {
          if (cancelled) return;
          setStatus('success');
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          if (cancelled) return;
          setStatus('failed');
        } else {
          // If still initiated, poll again after 2s
          attempts += 1;
          timeoutId = setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to query payment status:", err);
        setStatus('failed');
      }
    };

    checkStatus();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [transactionId]);

  const bookingFallbackRoute = '/renter-bookings';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              <p className="text-gray-500 text-center">Processing your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Payment successful! Your booking is confirmed.
              </p>
              
              {isEft && (
                <div className="w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 text-left space-y-2">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    Proof of Payment Required
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    Please email your Proof of Payment (PoP) to{" "}
                    <a
                      href="mailto:hello@mobirides.africa"
                      className="font-semibold underline hover:text-emerald-800 dark:hover:text-emerald-200"
                    >
                      hello@mobirides.africa
                    </a>{" "}
                    to finalize your booking verification.
                  </p>
                </div>
              )}

              <Button onClick={() => navigate(bookingId ? `/rental-details/${bookingId}` : bookingFallbackRoute)} className="w-full">
                View Booking
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Payment failed or was cancelled.
              </p>
              <Button onClick={() => navigate(bookingId ? `/rental-details/${bookingId}` : bookingFallbackRoute)} variant="outline" className="w-full">
                Return to Booking
              </Button>
            </>
          )}

          {status === 'not_found' && (
            <>
              <XCircle className="h-16 w-16 text-yellow-500" />
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Transaction ID not found.
              </p>
              <Button onClick={() => navigate(bookingFallbackRoute)} variant="outline" className="w-full">
                Go to Bookings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
