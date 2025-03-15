
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, FileText, Calendar, MapPin, Car, CreditCard } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";

const RentalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldPrint = location.search.includes('print=true');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['rental-details', id],
    queryFn: async () => {
      console.log('Fetching rental details for ID:', id);
      const { data, error } = await supabase.from('bookings').select(`
          *,
          renter:profiles!renter_id (
            id,
            full_name,
            avatar_url
          ),
          car:cars (
            *,
            owner:profiles!owner_id (
              id,
              full_name,
              avatar_url
            )
          )
        `).eq('id', id).single();
      
      if (error) throw error;
      return data;
    }
  });

  // Auto-print when print parameter is present
  useEffect(() => {
    if (shouldPrint && booking && !isLoading) {
      const timer = setTimeout(() => {
        window.print();
        // Remove the print parameter after printing
        navigate(`/rental-details/${id}`, { replace: true });
      }, 500); // Short delay to ensure content is rendered
      
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, booking, isLoading, id, navigate]);

  // Checking if the current user is the renter
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const isRenter = booking && currentUser && booking.renter_id === currentUser.id;
  const isOwner = booking && currentUser && booking.car.owner_id === currentUser.id;

  if (isLoading || isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-gray-600">Rental details not found</p>
        <Navigation />
      </div>
    );
  }

  const rentalDurationDays = differenceInDays(
    new Date(booking.end_date),
    new Date(booking.start_date)
  ) + 1; // Include the first day

  const isCompletedRental = booking.status === "completed";
  const isActiveRental = booking.status === "confirmed" && new Date(booking.end_date) >= new Date();

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Rental Details</h1>

        {/* Car Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <img 
                src={booking.car.image_url || "/placeholder.svg"} 
                alt={`${booking.car.brand} ${booking.car.model}`}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-lg">{booking.car.brand} {booking.car.model}</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.car.location}</span>
                </div>
                <p>BWP {booking.car.price_per_day} per day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renter Card - Show only to host */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Renter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src={booking.renter.avatar_url ? supabase.storage.from('avatars').getPublicUrl(booking.renter.avatar_url).data.publicUrl : "/placeholder.svg"} 
                  alt={booking.renter.full_name} 
                  className="w-16 h-16 rounded-full object-cover" 
                />
                <div>
                  <p className="font-medium">{booking.renter.full_name}</p>
                  {/* Additional renter info could go here */}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Host Card - Show only to renter */}
        {isRenter && (
          <Card>
            <CardHeader>
              <CardTitle>Host Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src={booking.car.owner.avatar_url ? supabase.storage.from('avatars').getPublicUrl(booking.car.owner.avatar_url).data.publicUrl : "/placeholder.svg"} 
                  alt={booking.car.owner.full_name} 
                  className="w-16 h-16 rounded-full object-cover" 
                />
                <div>
                  <p className="font-medium">{booking.car.owner.full_name}</p>
                  {/* Additional host info could go here */}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rental Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {format(new Date(booking.start_date), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {format(new Date(booking.end_date), 'PPP')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{rentalDurationDays} day{rentalDurationDays !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{booking.status}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <p>Daily Rate</p>
              <p>BWP {booking.car.price_per_day}</p>
            </div>
            <div className="flex justify-between">
              <p>Duration</p>
              <p>{rentalDurationDays} day{rentalDurationDays !== 1 ? 's' : ''}</p>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <p>Total</p>
              <p>BWP {booking.total_price}</p>
            </div>
            
            {isCompletedRental && (
              <Button 
                variant="outline" 
                className="w-full mt-4 flex items-center gap-2"
                onClick={() => window.print()}
              >
                <FileText className="h-4 w-4" />
                Download Receipt
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4">
          {(isCompletedRental || isActiveRental) && (
            <Button 
              className="flex items-center gap-2"
              onClick={() => navigate(`/rental-review/${booking.id}`)}
            >
              <Star className="h-4 w-4" />
              Write Review
            </Button>
          )}
          
          {isActiveRental && booking.renter && (
            <Button 
              className="flex items-center gap-2"
              onClick={() => navigate(`/map?bookingId=${booking.id}&renterId=${booking.renter.id}&mode=handover`)}
            >
              <MapPin className="h-4 w-4" />
              Track Location
            </Button>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default RentalDetails;
