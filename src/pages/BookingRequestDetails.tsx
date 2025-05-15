
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Calendar, MapPin, Car, Clock, CreditCard, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

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

  const updateBookingStatus = useMutation({
    mutationFn: async ({ status }: { status: 'confirmed' | 'cancelled'; }) => {
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
        description: `The booking request has been successfully ${action}.`
      });
      
      queryClient.invalidateQueries({
        queryKey: ['booking-request', id]
      });
    },
    onError: error => {
      console.error('Error updating booking status:', error);
      
      toast({
        title: "Error",
        description: "Failed to update the booking status. Please try again.",
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

  // Loading state
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

  // Error state
  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-300">Booking request not found</p>
      </div>
    );
  }

  // Check if the current user is the car owner
  const isCarOwner = userId === booking.car.owner_id;
  
  // Check if the current user is the renter
  const isRenter = userId === booking.renter_id;

  // Determine the status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

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
          <CardHeader className="bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-primary dark:text-primary-foreground">Booking Request Details</h1>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            {/* Renter Information */}
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
                  <Star className="h-4 w-4 text-primary" />
                </span>
                Renter Information
              </h2>
              <div className="flex items-center gap-4">
                <img 
                  src={booking.renter.avatar_url ? supabase.storage.from('avatars').getPublicUrl(booking.renter.avatar_url).data.publicUrl : "/placeholder.svg"} 
                  alt={booking.renter.full_name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <p className="font-medium text-foreground">{booking.renter.full_name}</p>
                  {typeof renterRating === 'number' && (
                    <div className="flex items-center gap-1 text-yellow-500 mt-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{renterRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Car Information */}
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
                  <Car className="h-4 w-4 text-primary" />
                </span>
                Requested Car
              </h2>
              <div className="flex flex-col md:flex-row gap-4">
                <img 
                  src={booking.car.image_url || "/placeholder.svg"} 
                  alt={`${booking.car.brand} ${booking.car.model}`} 
                  className="w-full md:w-48 h-32 object-cover rounded-lg"
                />
                <div className="space-y-2">
                  <p className="font-medium text-lg text-foreground">{booking.car.brand} {booking.car.model}</p>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {booking.car.location}
                  </p>
                  <p className="text-sm font-medium flex items-center">
                    <CreditCard className="h-4 w-4 mr-1 text-primary" />
                    BWP {booking.car.price_per_day} per day
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Dates */}
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </span>
                Booking Dates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-background">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {format(new Date(booking.start_date), 'PPP')}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-background">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {format(new Date(booking.end_date), 'PPP')}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </span>
                  <p className="font-semibold">Total Price</p>
                </div>
                <p className="text-xl font-bold">BWP {booking.total_price}</p>
              </div>
            </div>
          </CardContent>

          {/* Action Buttons */}
          {booking.status === 'pending' && (
            <CardFooter className="border-t bg-card p-6 flex flex-col sm:flex-row gap-4 justify-end">
              {isCarOwner ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 w-full sm:w-auto" 
                    onClick={handleCancel} 
                    disabled={updateBookingStatus.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Request
                  </Button>
                  <Button 
                    className="flex items-center gap-2 w-full sm:w-auto" 
                    onClick={handleApprove} 
                    disabled={updateBookingStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Request
                  </Button>
                </>
              ) : isRenter ? (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 w-full sm:w-auto" 
                  onClick={handleCancel} 
                  disabled={updateBookingStatus.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Request
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-muted-foreground gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Only car owners can approve requests</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You don't have permission to manage this booking request</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardFooter>
          )}
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default BookingRequestDetails;
