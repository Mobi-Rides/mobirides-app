
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HostDashboard = () => {
  const navigate = useNavigate();
  
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["host-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Fetching host bookings");
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);

      if (carsError) throw carsError;
      if (!cars.length) return [];

      const carIds = cars.map(car => car.id);
      
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
          renter:profiles!renter_id (
            full_name
          )
        `)
        .in("car_id", carIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Host bookings:", data);
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
  
  const activeBookings = bookings?.filter(b => 
    b.status === "confirmed" && 
    new Date(b.start_date) <= today && 
    new Date(b.end_date) >= today
  );
  
  const pendingBookings = bookings?.filter(b => 
    b.status === "pending"
  );
  
  const completedBookings = bookings?.filter(b => 
    b.status === "completed" || 
    (b.status === "confirmed" && new Date(b.end_date) < today)
  );

  const handleCardClick = (bookingId: string) => {
    navigate(`/rental-details/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Rentals</TabsTrigger>
          <TabsTrigger value="pending">Booking Requests</TabsTrigger>
          <TabsTrigger value="completed">Past Rentals</TabsTrigger>
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
                      Rented by: {booking.renter?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm">
                      From: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      To: {format(new Date(booking.end_date), "PPP")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid gap-4">
            {pendingBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No booking requests
              </p>
            )}
            {pendingBookings?.map((booking) => (
              <Card 
                key={booking.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/booking-requests/${booking.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Requested by: {booking.renter?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm">
                      From: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      To: {format(new Date(booking.end_date), "PPP")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4">
            {completedBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No completed rentals
              </p>
            )}
            {completedBookings?.map((booking) => (
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
                      Rented by: {booking.renter?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm">
                      From: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      To: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    {booking.status === "completed" && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rental-details/${booking.id}?print=true`);
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Receipt
                        </Button>
                      </div>
                    )}
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
