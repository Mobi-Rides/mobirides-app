import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingView } from '@/components/home/LoadingView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Car, MapPin, User, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  cars: Database['public']['Tables']['cars']['Row'] | null;
  renter: Database['public']['Tables']['profiles']['Row'] | null;
  host: Database['public']['Tables']['profiles']['Row'] | null;
};

export const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      if (!id) throw new Error('Booking ID is required');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          renter:profiles!bookings_renter_id_fkey (*),
          host:profiles!bookings_host_id_fkey (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Booking;
    },
    enabled: !!id,
  });

  if (!id) {
    return <Navigate to="/bookings" replace />;
  }

  if (isLoading) {
    return <LoadingView />;
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
          <p className="text-muted-foreground mb-4">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to view this booking
  const isRenter = user?.id === booking.renter_id;
  const isHost = user?.id === booking.host_id;
  
  if (!isRenter && !isHost) {
    return <Navigate to="/bookings" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="mb-4"
        >
          ← Back
        </Button>
        <h1 className="text-3xl font-bold">Booking Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Booking ID:</span>
              <span className="text-sm text-muted-foreground">#{booking.id}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Start:</span>
                <span>{formatDate(booking.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">End:</span>
                <span>{formatDate(booking.end_date)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Amount:
              </span>
              <span className="font-bold text-lg">P{booking.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Car Information */}
        {booking.cars && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.cars.year} {booking.cars.make} {booking.cars.model}
                </h3>
                <p className="text-muted-foreground">{booking.cars.color}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">License Plate:</span>
                <span className="font-mono">{booking.cars.license_plate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Daily Rate:</span>
                <span>P{booking.cars.daily_rate}/day</span>
              </div>
              {booking.pickup_location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <div>
                    <span className="font-medium">Pickup Location:</span>
                    <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isRenter ? 'Host Information' : 'Renter Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRenter && booking.host && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Name:</span>
                  <span>{booking.host.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Phone:</span>
                  <span>{booking.host.phone_number || 'Not provided'}</span>
                </div>
              </>
            )}
            {isHost && booking.renter && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Name:</span>
                  <span>{booking.renter.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Phone:</span>
                  <span>{booking.renter.phone_number || 'Not provided'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Created:</span>
              <span className="text-sm">{formatDate(booking.created_at)}</span>
            </div>
            {booking.updated_at && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Last Updated:</span>
                <span className="text-sm">{formatDate(booking.updated_at)}</span>
              </div>
            )}
            {booking.notes && (
              <div>
                <span className="font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingDetails;