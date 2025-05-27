
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Calendar, MapPin, Car, Clock, CreditCard, CheckCircle, XCircle, AlertCircle, Wallet } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { WalletBalanceIndicator } from "@/components/dashboard/WalletBalanceIndicator";
import { commissionService } from "@/services/commissionService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookingRequestHeader } from "@/components/booking-request/BookingRequestHeader";
import { RenterInformation } from "@/components/booking-request/RenterInformation";
import { CarInformation } from "@/components/booking-request/CarInformation";
import { BookingDates } from "@/components/booking-request/BookingDates";
import { BookingPrice } from "@/components/booking-request/BookingPrice";
import { WalletCommissionSection } from "@/components/booking-request/WalletCommissionSection";
import { BookingActions } from "@/components/booking-request/BookingActions";

const BookingRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAuthStatus();
  const isMobile = useIsMobile();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-request', id],
    queryFn: async () => {
      console.log('Fetching booking request details for ID:', id);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          renter:profiles!renter_id (
            full_name,
            avatar_url
          ),
          car:cars (
            brand,
            model,
            image_url,
            location,
            price_per_day,
            owner_id
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fix: Move isCarOwner declaration here, before it's used
  const isCarOwner = userId === booking?.car.owner_id;
  const isRenter = userId === booking?.renter_id;

  const { data: renterRating } = useQuery({
    queryKey: ['renter-rating', booking?.renter_id],
    queryFn: async () => {
      if (!booking?.renter_id) return null;
      
      const { data } = await supabase.rpc('calculate_user_rating', {
        user_uuid: booking.renter_id
      });
      
      return data;
    },
    enabled: !!booking?.renter_id
  });

  const { data: walletCheck } = useQuery({
    queryKey: ['wallet-acceptance-check', userId, booking?.total_price],
    queryFn: async () => {
      if (!userId || !booking?.total_price || !isCarOwner) return null;
      return await commissionService.checkHostCanAcceptBooking(userId, booking.total_price);
    },
    enabled: !!userId && !!booking?.total_price && isCarOwner
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ status }: { status: 'confirmed' | 'cancelled'; }) => {
      console.log('Updating booking status:', status);
      
      if (status === 'confirmed' && booking && userId) {
        const canAccept = await commissionService.checkHostCanAcceptBooking(userId, booking.total_price);
        
        if (!canAccept.canAccept) {
          throw new Error(canAccept.message || 'Insufficient wallet balance');
        }

        const commissionDeducted = await commissionService.deductCommissionOnBookingAcceptance(
          userId, 
          booking.id, 
          booking.total_price
        );
        
        if (!commissionDeducted) {
          throw new Error('Failed to process commission payment');
        }
      }
      
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const action = variables.status === 'confirmed' ? 'approved' : 'cancelled';
      
      toast({
        title: `Booking ${action}`,
        description: variables.status === 'confirmed' 
          ? `Booking approved and commission deducted from your wallet.`
          : `The booking request has been cancelled.`
      });
      
      queryClient.invalidateQueries({
        queryKey: ['booking-request', id]
      });
      
      queryClient.invalidateQueries({
        queryKey: ['wallet-balance']
      });
    },
    onError: error => {
      console.error('Error updating booking status:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update the booking status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleApprove = () => {
    updateBookingStatus.mutate({ status: 'confirmed' });
  };

  const handleCancel = () => {
    updateBookingStatus.mutate({ status: 'cancelled' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-300">Booking request not found</p>
      </div>
    );
  }

  const canApproveBooking = walletCheck?.canAccept ?? true;

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <BookingRequestHeader status={booking.status} />
          
          <CardContent className="p-6 space-y-8">
            <RenterInformation 
              renter={booking.renter} 
              renterRating={renterRating} 
            />
            <CarInformation car={booking.car} />
            <BookingDates 
              startDate={booking.start_date} 
              endDate={booking.end_date} 
            />
            <BookingPrice totalPrice={booking.total_price} />
          </CardContent>

          {isCarOwner && booking.status === 'pending' && (
            <WalletCommissionSection 
              bookingTotal={booking.total_price}
              canApproveBooking={canApproveBooking}
            />
          )}

          {booking.status === 'pending' && (
            <BookingActions 
              isCarOwner={isCarOwner}
              isRenter={isRenter}
              canApproveBooking={canApproveBooking}
              onApprove={handleApprove}
              onCancel={handleCancel}
              isLoading={updateBookingStatus.isPending}
            />
          )}
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default BookingRequestDetails;
