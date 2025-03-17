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
      try {
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

        if (error) {
          console.error('Error fetching notification:', error);
          throw error;
        }
        
        // Mark notification as read
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);

        return data;
      } catch (error) {
        console.error('Error in notification query:', error);
        toast.error('Failed to load notification details');
        throw error;
      }
    }
  });

  const handleLocationRequest = async () => {
    console.log('Location request initiated');
    
    if (!notification?.booking?.id || !notification?.booking?.cars?.owner_id) {
      console.error('Missing booking information:', { notification });
      toast.error("Booking information not found");
      return;
    }

    try {
      // Request location permission
      if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          console.log('Position received:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });

          try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) {
              throw new Error('Authentication error: ' + authError.message);
            }
            
            if (!user) {
              throw new Error('User not authenticated');
            }

            // Update user's location in the database
            const { data: cars, error: carsError } = await supabase
              .from('cars')
              .select('id')
              .eq('owner_id', user.id);

            if (carsError) {
              throw new Error('Error fetching cars: ' + carsError.message);
            }

            if (!cars || cars.length === 0) {
              throw new Error('No cars found for user');
            }

            console.log('Updating location for cars:', cars);

            for (const car of cars) {
              const success = await updateCarLocation(
                car.id,
                position.coords.latitude,
                position.coords.longitude
              );
              
              if (!success) {
                console.error('Failed to update location for car:', car.id);
              }
            }

            // Navigate to map page to see host's location
            navigate(`/map?bookingId=${notification.booking.id}&hostId=${notification.booking.cars.owner_id}&mode=handover`);
          } catch (error) {
            console.error('Error processing location update:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to process location update');
            
            // Clear the watch if we encounter an error
            navigator.geolocation.clearWatch(watchId);
            localStorage.removeItem('locationWatchId');
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = 'Failed to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          toast.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Store watchId in localStorage to clear it later if needed
      localStorage.setItem('locationWatchId', watchId.toString());
      console.log('Location watch started with ID:', watchId);

    } catch (error) {
      console.error("Error in location request handler:", error);
      toast.error("Failed to process location request. Please try again.");
    }
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-semibold mb-4 dark:text-white">Notification Details</h1>
        
        {notification ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">{notification.content}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
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
          <p className="text-gray-600 dark:text-gray-300">Notification not found</p>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default NotificationDetails;
