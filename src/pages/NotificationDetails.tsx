
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import { updateCarLocation } from "@/services/carLocation";

const NotificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: notification, isLoading } = useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      console.log('Fetching notification details for ID:', id);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          booking:bookings!related_booking_id (
            id,
            cars (
              owner_id
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      return data;
    }
  });

  const handleLocationRequest = async () => {
    if (!notification?.booking?.id || !notification?.booking?.cars?.owner_id) {
      toast.error("Booking information not found");
      return;
    }

    try {
      // Request location permission
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            toast.error("User not authenticated");
            return;
          }

          // Update user's location in the database
          const { data: cars } = await supabase
            .from('cars')
            .select('id')
            .eq('owner_id', user.id);

          if (cars) {
            for (const car of cars) {
              await updateCarLocation(
                car.id,
                position.coords.latitude,
                position.coords.longitude
              );
            }
          }

          // Navigate to map page to see host's location
          navigate(`/map?bookingId=${notification.booking.id}&hostId=${notification.booking.cars.owner_id}&mode=handover`);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get your location. Please enable location services.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      // Store watchId in localStorage to clear it later if needed
      localStorage.setItem('locationWatchId', watchId.toString());

    } catch (error) {
      console.error("Error handling location request:", error);
      toast.error("Failed to process location request");
    }
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

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Notification Details</h1>
        
        {notification ? (
          <div className="space-y-4">
            <p className="text-gray-600">{notification.content}</p>
            <p className="text-sm text-gray-400">
              Received on: {new Date(notification.created_at).toLocaleDateString()}
            </p>
            
            {notification.type === 'booking_request' && notification.related_booking_id && (
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/booking-requests/${notification.related_booking_id}`)}
                >
                  View Booking Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {notification.content.includes("requesting your location") && (
                  <Button 
                    variant="default"
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleLocationRequest}
                  >
                    Share Location & View Host
                    <MapPin className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Notification not found</p>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default NotificationDetails;
