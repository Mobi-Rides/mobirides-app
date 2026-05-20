import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail, Car, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";

interface BookingContext {
  referenceNo: string;
  carName: string;
  startDate: string;
  endDate: string;
}

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transaction_id");

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'not_found'>('loading');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isEft, setIsEft] = useState(false);
  const [bookingContext, setBookingContext] = useState<BookingContext | null>(null);
  const MAX_ATTEMPTS = 15;

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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [transactionId]);

  // Fetch booking context once we have a bookingId and payment succeeded
  useEffect(() => {
    if (!bookingId || status !== 'success') return;

    supabase
      .from('bookings')
      .select('id, start_date, end_date, cars(brand, model)')
      .eq('id', bookingId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        const car = data.cars as { brand: string; model: string } | null;
        setBookingContext({
          referenceNo: data.id.slice(-8).toUpperCase(),
          carName: car ? `${car.brand} ${car.model}` : 'Vehicle',
          startDate: data.start_date,
          endDate: data.end_date,
        });
      });
  }, [bookingId, status]);

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
              <p className="text-gray-700 dark:text-gray-300 text-center font-medium">
                Payment successful! Your booking is confirmed.
              </p>

              {/* Booking context card */}
              {bookingContext && (
                <div className="w-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium uppercase tracking-wide">Reference</p>
                      <p className="font-semibold text-green-900 dark:text-green-100">#{bookingContext.referenceNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Car className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium uppercase tracking-wide">Vehicle</p>
                      <p className="font-semibold text-green-900 dark:text-green-100">{bookingContext.carName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium uppercase tracking-wide">Rental Period</p>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        {format(new Date(bookingContext.startDate), 'MMM d, yyyy')} – {format(new Date(bookingContext.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
