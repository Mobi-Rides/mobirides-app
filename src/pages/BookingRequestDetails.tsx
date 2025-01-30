import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Star } from "lucide-react";
import { format } from "date-fns";

const BookingRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
            price_per_day
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: renterRating } = useQuery({
    queryKey: ['renter-rating', booking?.renter_id],
    queryFn: async () => {
      if (!booking?.renter_id) return null;
      
      const { data } = await supabase
        .rpc('calculate_user_rating', {
          user_uuid: booking.renter_id
        });
      
      return data;
    },
    enabled: !!booking?.renter_id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Booking request not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6">Booking Request Details</h1>
          
          <div className="space-y-6">
            {/* Renter Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Renter Information</h2>
              <div className="flex items-center gap-4">
                <img
                  src={booking.renter.avatar_url 
                    ? supabase.storage.from('avatars').getPublicUrl(booking.renter.avatar_url).data.publicUrl
                    : "/placeholder.svg"
                  }
                  alt={booking.renter.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{booking.renter.full_name}</p>
                  {typeof renterRating === 'number' && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{renterRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Car Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Requested Car</h2>
              <div className="flex gap-4">
                <img
                  src={booking.car.image_url || "/placeholder.svg"}
                  alt={`${booking.car.brand} ${booking.car.model}`}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div>
                  <p className="font-medium">{booking.car.brand} {booking.car.model}</p>
                  <p className="text-sm text-gray-600">{booking.car.location}</p>
                  <p className="text-sm font-medium">BWP {booking.car.price_per_day} per day</p>
                </div>
              </div>
            </div>

            {/* Booking Dates */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Booking Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.start_date), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.end_date), 'PPP')}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold">Total Price</p>
                <p className="text-xl font-bold">BWP {booking.total_price}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default BookingRequestDetails;