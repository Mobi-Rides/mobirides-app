
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Star } from "lucide-react";

export const RenterDashboard = () => {
  const navigate = useNavigate();
  
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["renter-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Fetching renter bookings");
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            location,
            image_url
          ),
          reviews!reviews_booking_id_fkey (
            id
          )
        `)
        .eq("renter_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      console.log("Renter bookings:", data);
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const today = new Date();
  
  const activeBookings = bookings?.filter(b => {
    const endDate = new Date(b.end_date);
    const hasReview = b.reviews && b.reviews.length > 0;
    
    return (
      b.status === "confirmed" && 
      new Date(b.start_date) <= today && 
      (endDate >= today || !hasReview)
    );
  });
  
  const upcomingBookings = bookings?.filter(b => 
    (b.status === "pending" || b.status === "confirmed") && 
    new Date(b.start_date) > today
  );
  
  const pastBookings = bookings?.filter(b => {
    const endDate = new Date(b.end_date);
    const hasReview = b.reviews && b.reviews.length > 0;
    
    return (
      b.status === "completed" || 
      b.status === "cancelled" ||
      (endDate < today && hasReview)
    );
  });

  const handleCardClick = (bookingId: string) => {
    navigate(`/rental-details/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Rentals</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4">
            {activeBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No active rentals
              </p>
            )}
            {activeBookings?.map((booking) => (
              <Card 
                key={booking.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(booking.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {booking.cars.location}
                    </p>
                    <p className="text-sm">
                      Pickup: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      Return: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-2xl border-[#8459FB] text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rental-review/${booking.id}`);
                        }}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-4">
            {upcomingBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No upcoming rentals
              </p>
            )}
            {upcomingBookings?.map((booking) => (
              <Card 
                key={booking.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(booking.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {booking.cars.location}
                    </p>
                    <p className="text-sm">
                      Pickup: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      Return: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    <p className="text-sm font-medium">
                      Status: <span className="capitalize">{booking.status}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-4">
            {pastBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No past rentals
              </p>
            )}
            {pastBookings?.map((booking) => (
              <Card 
                key={booking.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(booking.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {booking.cars.location}
                    </p>
                    <p className="text-sm">
                      Pickup: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      Return: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      {booking.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Print functionality will be handled in the details page
                            navigate(`/rental-details/${booking.id}?print=true`);
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Receipt
                        </Button>
                      )}
                      {!booking.reviews?.length && (
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-2xl border-[#8459FB] text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rental-review/${booking.id}`);
                          }}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
