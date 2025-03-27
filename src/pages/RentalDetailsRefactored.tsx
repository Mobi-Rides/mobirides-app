
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { useRentalDetails } from "@/hooks/useRentalDetails";
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

const RentalDetailsRefactored = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
        status={booking.status} 
        onBack={() => navigate(-1)} 
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

        {/* Car Info */}
        <RentalCarInfoCard car={booking.car} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Person Card - Conditionally show host or renter */}
          {isRenter ? (
            <CarOwner
              ownerName={booking.car.owner.full_name}
              avatarUrl={booking.car.owner.avatar_url}
              ownerId={booking.car.owner.id}
              carId={booking.car.id}
            />
          ) : (
            <RentalUserCard 
              user={booking.renter} 
              role="Renter" 
            />
          )}

          {/* Rental Duration Card */}
          <RentalDurationCard 
            startDate={booking.start_date} 
            endDate={booking.end_date} 
            durationDays={rentalDurationDays} 
          />
        </div>

        {/* Description */}
        <CarDescription description={booking.car.description} />

        {/* Payment Details Card */}
        <RentalPaymentDetails 
          pricePerDay={booking.car.price_per_day} 
          durationDays={rentalDurationDays} 
          totalPrice={booking.total_price} 
        />

        {/* Actions */}
        <RentalActions 
          bookingId={booking.id}
          canHandover={canHandover}
          handoverType={handoverType}
          isInitiatingHandover={isInitiatingHandover}
          isCompletedRental={isCompletedRental}
          isActiveRental={isActiveRental}
          isRenter={isRenter}
          onHandoverInitiate={onInitiateHandover}
        />
      </div>

      <Navigation />
    </div>
  );
};

export default RentalDetailsRefactored;
