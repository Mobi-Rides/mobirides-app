import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { useState } from "react";

const BookingRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-request', id],
    queryFn: async () => {
      console.log('Fetching booking request details for ID:', id);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          renter:profiles!bookings_renter_id_fkey (
            full_name,
            avatar_url
          ),
          car:cars!bookings_car_id_fkey (
            brand,
            model,
            image_url,
            location,
            price_per_day,
            owner_id,
            owner:profiles!cars_owner_id_fkey (
              id,
              full_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
        throw error;
      }
      console.log('Fetched booking data:', data);
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

  const updateBookingStatus = useMutation({
    mutationFn: async ({ status }: { status: 'confirmed' | 'cancelled' }) => {
      console.log('Updating booking status:', status);
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
        description: `The booking request has been successfully ${action}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['booking-request', id] });
    },
    onError: (error) => {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update the booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMessageHost = () => {
    if (!booking?.car?.owner) {
      toast({
        title: "Error",
        description: "Could not find car owner details",
        variant: "destructive",
      });
      return;
    }
    setIsChatOpen(true);
  };

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Booking Request Details</h1>
            <Button
              onClick={handleMessageHost}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Message Host
            </Button>
          </div>
          
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

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Total Price</p>
              <p className="text-xl font-bold">BWP {booking.total_price}</p>
            </div>
          </div>

          {booking.status === 'pending' && (
            <div className="flex gap-4 justify-end border-t pt-6">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => updateBookingStatus.mutate({ status: 'cancelled' })}
                disabled={updateBookingStatus.isPending}
              >
                <XCircle className="h-4 w-4" />
                Cancel Request
              </Button>
              <Button
                className="flex items-center gap-2"
                onClick={() => updateBookingStatus.mutate({ status: 'confirmed' })}
                disabled={updateBookingStatus.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Approve Request
              </Button>
            </div>
          )}

          {booking.status !== 'pending' && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium">
                Status: <span className="capitalize">{booking.status}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {booking.car?.owner && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          receiverId={booking.car.owner.id}
          receiverName={booking.car.owner.full_name}
          carId={booking.car_id}
        />
      )}

      <Navigation />
    </div>
  );
};

export default BookingRequestDetails;