
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const HostDashboard = () => {
  const navigate = useNavigate();
  
  const { data: hostData, isLoading } = useQuery({
    queryKey: ["host-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Fetching host data");
      const [carsResponse, bookingsResponse] = await Promise.all([
        supabase
          .from("cars")
          .select("*")
          .eq("owner_id", user.id),
        supabase
          .from("bookings")
          .select(`
            *,
            cars (
              brand,
              model,
              location
            ),
            renter:profiles!renter_id (
              full_name,
              id
            )
          `)
          .eq("cars.owner_id", user.id)
          .order("start_date", { ascending: true })
      ]);

      if (carsResponse.error) throw carsResponse.error;
      if (bookingsResponse.error) throw bookingsResponse.error;

      // Add test data for returned booking
      const testReturnedBooking = {
        id: "test-returned-123",
        start_date: "2024-02-01",
        end_date: "2024-02-05",
        status: "completed",
        cars: {
          brand: "Toyota",
          model: "Corolla",
          location: "Gaborone Main Mall"
        },
        renter: {
          full_name: "John Test",
          id: "test-renter-123"
        }
      };

      const bookingsWithTestData = [...bookingsResponse.data, testReturnedBooking];

      console.log("Host cars:", carsResponse.data);
      console.log("Host bookings with test data:", bookingsWithTestData);

      return {
        cars: carsResponse.data,
        bookings: bookingsWithTestData
      };
    }
  });

  const initiateHandover = async (bookingId: string, renterId: string) => {
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: renterId,
          content: 'Your host is requesting your location for vehicle handover.',
          type: 'booking_request',
          related_booking_id: bookingId,
          is_read: false
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        throw notificationError;
      }

      toast.success("Handover request sent to renter");
      navigate(`/map?bookingId=${bookingId}&renterId=${renterId}&mode=handover`);
    } catch (error) {
      console.error("Error initiating handover:", error);
      toast.error("Failed to send handover request");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const activeBookings = hostData?.bookings.filter(b => 
    b.status === "confirmed" && new Date(b.end_date) >= new Date()
  );
  const pendingRequests = hostData?.bookings.filter(b => b.status === "pending");
  const returnedBookings = hostData?.bookings.filter(b =>
    b.status === "completed"
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Cars</h2>
        <Link to="/add-car">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Car
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="cars">
        <TabsList>
          <TabsTrigger value="cars">Listed Cars</TabsTrigger>
          <TabsTrigger value="active">Active Rentals</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="returned">Returned</TabsTrigger>
        </TabsList>

        <TabsContent value="cars">
          <div className="grid gap-4">
            {hostData?.cars.map((car) => (
              <Card key={car.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {car.brand} {car.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {car.location}
                    </p>
                    <p className="text-sm">
                      Price: BWP {car.price_per_day} per day
                    </p>
                    <Link to={`/edit-car/${car.id}`}>
                      <Button variant="outline" size="sm">
                        Edit Car
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid gap-4">
            {activeBookings?.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Renter: {booking.renter.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Location: {booking.cars.location}
                    </p>
                    <p className="text-sm">
                      Pickup: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      Return: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    <div className="flex justify-between items-center pt-2">
                      <Link to={`/booking-requests/${booking.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        variant="default"
                        size="sm"
                        className={`${isToday(parseISO(booking.start_date)) ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/80"}`}
                        disabled={!isToday(parseISO(booking.start_date))}
                        onClick={() => initiateHandover(booking.id, booking.renter.id)}
                      >
                        Initiate Handover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="grid gap-4">
            {pendingRequests?.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Renter: {booking.renter.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Location: {booking.cars.location}
                    </p>
                    <p className="text-sm">
                      Pickup: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      Return: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    <Link to={`/booking-requests/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View Request
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="returned">
          <div className="grid gap-4">
            {returnedBookings?.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {booking.cars.brand} {booking.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Renter: {booking.renter.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Location: {booking.cars.location}
                    </p>
                    <p className="text-sm">
                      Pickup: {format(new Date(booking.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      Return: {format(new Date(booking.end_date), "PPP")}
                    </p>
                    <Link to={`/booking-requests/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
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
