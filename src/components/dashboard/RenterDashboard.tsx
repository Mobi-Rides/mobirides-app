
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const RenterDashboard = () => {
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
  
  const activeBookings = bookings?.filter(b => 
    b.status === "confirmed" && 
    new Date(b.start_date) <= today && 
    new Date(b.end_date) >= today
  );
  
  const upcomingBookings = bookings?.filter(b => 
    (b.status === "pending" || b.status === "confirmed") && 
    new Date(b.start_date) > today
  );
  
  const pastBookings = bookings?.filter(b => 
    b.status === "completed" || 
    b.status === "cancelled" ||
    new Date(b.end_date) < today
  );

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
              <p className="text-muted-foreground text-center py-4">No active rentals</p>
            )}
            {activeBookings?.map((booking) => (
              <Card key={booking.id}>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-4">
            {upcomingBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No upcoming rentals</p>
            )}
            {upcomingBookings?.map((booking) => (
              <Card key={booking.id}>
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
                    <p className="text-sm font-medium">Status: {booking.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-4">
            {pastBookings?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No past rentals</p>
            )}
            {pastBookings?.map((booking) => (
              <Card key={booking.id}>
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
