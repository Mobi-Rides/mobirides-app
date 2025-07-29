import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Car, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserBookingsTabProps {
  userId: string;
}

const useUserBookings = (userId: string) => {
  return useQuery({
    queryKey: ["user-bookings", userId],
    queryFn: async () => {
      // Get bookings as renter
      const { data: renterBookings, error: renterError } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            id, brand, model, image_url, owner_id,
            profiles:owner_id (full_name)
          )
        `)
        .eq("renter_id", userId)
        .order("created_at", { ascending: false });

      if (renterError) throw renterError;

      // Get bookings as host
      const { data: hostBookings, error: hostError } = await supabase
        .from("bookings")
        .select(`
          *,
          cars!inner (
            id, brand, model, image_url, owner_id
          ),
          profiles:renter_id (full_name)
        `)
        .eq("cars.owner_id", userId)
        .order("created_at", { ascending: false });

      if (hostError) throw hostError;

      return {
        asRenter: renterBookings || [],
        asHost: hostBookings || [],
      };
    },
  });
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "confirmed": return "default";
    case "completed": return "secondary";
    case "cancelled": return "destructive";
    case "pending": return "outline";
    default: return "outline";
  }
};

export const UserBookingsTab = ({ userId }: UserBookingsTabProps) => {
  const navigate = useNavigate();
  const { data: bookings, isLoading, error } = useUserBookings(userId);

  const handleViewBooking = (bookingId: string) => {
    navigate(`/admin/bookings?booking=${bookingId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load bookings</p>
        </CardContent>
      </Card>
    );
  }

  const allBookings = [
    ...(bookings?.asRenter?.map(b => ({ ...b, role: "renter" })) || []),
    ...(bookings?.asHost?.map(b => ({ ...b, role: "host" })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {bookings?.asRenter?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">As Renter</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {bookings?.asHost?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">As Host</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {allBookings.filter(b => b.status === "completed").length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {allBookings.filter(b => b.status === "cancelled").length}
            </div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {allBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bookings found
            </p>
          ) : (
            <div className="space-y-4">
              {allBookings.slice(0, 10).map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        {booking.cars?.image_url ? (
                          <img 
                            src={booking.cars.image_url} 
                            alt="Car"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Car className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">
                            {booking.cars?.brand} {booking.cars?.model}
                          </h4>
                          <Badge variant={getStatusBadgeVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge variant={booking.role === "renter" ? "default" : "secondary"}>
                            As {booking.role}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(booking.start_date).toLocaleDateString()} - 
                              {new Date(booking.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>P{booking.total_price}</span>
                          </div>
                        </div>
                        {booking.role === "renter" && booking.cars && 'profiles' in booking.cars && booking.cars.profiles && (
                          <div className="text-sm text-muted-foreground">
                            Host: {booking.cars.profiles.full_name || "Unknown"}
                          </div>
                        )}
                        {booking.role === "host" && 'profiles' in booking && booking.profiles && (
                          <div className="text-sm text-muted-foreground">
                            Renter: {booking.profiles.full_name || "Unknown"}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewBooking(booking.id)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};