
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Receipt, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { useRentalDetails } from "@/hooks/useRentalDetails";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarDescription } from "@/components/car-details/CarDescription";
import { CarOwner } from "@/components/car-details/CarOwner";
import { RentalDetailsHeader } from "@/components/rental-details/RentalDetailsHeader";
import { RentalCarInfoCard } from "@/components/rental-details/RentalCarInfoCard";
import { RentalDurationCard } from "@/components/rental-details/RentalDurationCard";
import { RentalPaymentDetails } from "@/components/rental-details/RentalPaymentDetails";
import { RentalActions } from "@/components/rental-details/RentalActions";
import { RentalUserCard } from "@/components/rental-details/RentalUserCard";
import { RentalDetailsSkeleton } from "@/components/rental-details/RentalDetailsSkeleton";
import { RentalDetailsNotFound } from "@/components/rental-details/RentalDetailsNotFound";
import { RenterPaymentModal } from "@/components/booking/RenterPaymentModal";
import { PaymentDeadlineTimer } from "@/components/booking/PaymentDeadlineTimer";
import { handleExpiredBookings } from "@/services/bookingService";
import { useHardwareBackButton } from "@/hooks/useHardwareBackButton";

const RentalDetailsRefactored = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle Android hardware back button
  useHardwareBackButton();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    booking,
    isBookingLoading,
    isUserLoading,
    isRenter,
    isOwner,
    isActiveRental,
    isCompletedRental,
    canHandover,
    handoverType,
    rentalDurationDays,
    isInitiatingHandover,
    handleInitiateHandover,
    id
  } = useRentalDetails();


  // Query insurance package name
  const { data: insurancePackageName } = useQuery({
    queryKey: ['insurance-package-name', booking?.insurance_policy_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('insurance_policies' as any)
        .select('insurance_packages(display_name)')
        .eq('id', booking!.insurance_policy_id)
        .single();
      return (data as any)?.insurance_packages?.display_name || null;
    },
    enabled: !!booking?.insurance_policy_id,
  });

  // Expire stale bookings on mount
  useEffect(() => {
    handleExpiredBookings();
  }, []);

  // Auto-open payment modal via URL param (?pay=true)
  useEffect(() => {
    const shouldOpen = searchParams.get('pay') === 'true';
    if (shouldOpen && booking?.status === 'awaiting_payment') {
      setIsPaymentModalOpen(true);
      // Clean up the URL param so refreshing doesn't re-trigger
      if (searchParams.get('pay')) {
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('pay');
          return newParams;
        }, { replace: true });
      }
    }
  }, [booking, searchParams, setSearchParams]);

  const handleExtensionUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const onInitiateHandover = async () => {
    const session = await handleInitiateHandover();
    if (session) {
      // Navigate to map with handover mode
      const role = isRenter ? "renter" : "host";
      navigate(`/map?bookingId=${booking.id}&mode=handover&role=${role}`);
    }
  };

  if (isBookingLoading || isUserLoading) {
    return <RentalDetailsSkeleton />;
  }

  if (!booking) {
    return <RentalDetailsNotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 animate-fade-in">
      <RentalDetailsHeader
        status={booking?.status || 'unknown'}
        onBack={() => navigate('/bookings')}
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold">Rental Details</h1>
          {isCompletedRental && (
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate("/insurance/policies")}
              >
                <Shield className="h-4 w-4" />
                View Policy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.print()}
              >
                <Receipt className="h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          )}
        </div>

        {/* Car Info with null check */}
        {booking?.cars && <RentalCarInfoCard car={booking.cars} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Person Card - Conditionally show host or renter with null checks */}
          {isRenter && booking?.cars?.owner ? (
            <CarOwner
              ownerName={booking.cars.owner?.full_name || 'Unknown Owner'}
              avatarUrl={booking.cars.owner?.avatar_url || ''}
              ownerId={booking.cars.owner?.id || ''}
            />
          ) : booking?.renter ? (
            <RentalUserCard
              user={booking.renter}
              role="Renter"
            />
          ) : null}

          {/* Rental Duration Card with null checks */}
          {booking?.start_date && booking?.end_date && (
            <RentalDurationCard
              startDate={booking.start_date}
              endDate={booking.end_date}
              durationDays={rentalDurationDays}
            />
          )}
        </div>

        {/* Description with null check */}
        {booking?.cars?.description && (
          <CarDescription description={booking.cars.description} />
        )}

        {/* Payment Details Card with null checks */}
        {booking?.cars?.price_per_day && booking?.total_price && (
          <RentalPaymentDetails
            pricePerDay={booking.cars.price_per_day}
            durationDays={rentalDurationDays}
            totalPrice={booking.total_price}
            baseRentalPrice={booking.base_rental_price || booking.total_price}
            insurancePremium={booking.insurance_premium || 0}
            discountAmount={booking.discount_amount || 0}
            dynamicMultiplier={booking.dynamic_pricing_multiplier || 1}
            destinationType={booking.destination_type as 'local' | 'out_of_zone' | 'cross_border' | undefined}
            isPaid={booking.payment_status === 'paid' || booking.status === 'confirmed' || booking.status === 'completed'}
            insurancePackageName={insurancePackageName || undefined}
          />
        )}

        {/* Extension Status removed for simplification */}

        {/* Payment Deadline Timer for awaiting_payment */}
        {booking?.status === 'awaiting_payment' && (
          <PaymentDeadlineTimer
            deadline={booking.payment_deadline || new Date(new Date(booking.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()}
            className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800"
          />
        )}

        {/* Actions with null check */}
        {booking?.id && (
          <RentalActions
            bookingId={booking.id}
            booking={booking}
            canHandover={canHandover}
            handoverType={handoverType}
            isInitiatingHandover={isInitiatingHandover}
            isCompletedRental={isCompletedRental}
            isActiveRental={isActiveRental}
            isRenter={isRenter}
            onHandoverInitiate={onInitiateHandover}
            onExtensionRequested={handleExtensionUpdate}
            onPayNow={() => setIsPaymentModalOpen(true)}
          />
        )}
      </div>

      {booking && (
        <RenterPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          booking={booking}
          onPaymentSuccess={() => {
            // Trigger refresh
            handleExtensionUpdate(); // Reuse refresh logic
          }}
        />
      )}

      <Navigation />
    </div>
  );
};

export default RentalDetailsRefactored;
