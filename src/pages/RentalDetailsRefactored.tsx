
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { useRentalDetails } from "@/hooks/useRentalDetails";
import { useAuth } from "@/hooks/useAuth";
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
// Extension status removed for simplification

const RentalDetailsRefactored = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
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
            <Button
              variant="outline"
              size="sm"
              className="mt-2 sm:mt-0 flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Receipt className="h-4 w-4" />
              Download Receipt
            </Button>
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
          />
        )}

        {/* Extension Status removed for simplification */}

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
          />
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default RentalDetailsRefactored;
