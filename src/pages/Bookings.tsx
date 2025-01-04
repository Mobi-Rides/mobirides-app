import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Bookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      console.log("Fetching user bookings");
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            image_url,
            owner_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }

      console.log("Bookings fetched:", data);
      return data;
    },
  });

  const createCancellationNotifications = async (booking: any) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    // Create a notification for the car owner
    await supabase.from("notifications").insert([{
      user_id: booking.cars.owner_id,
      type: "booking_cancelled",
      content: `Booking for ${booking.cars.brand} ${booking.cars.model} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`,
      related_car_id: booking.car_id,
      related_booking_id: booking.id
    }]);

    // Create a notification for the renter (confirmation)
    await supabase.from("notifications").insert([{
      user_id: session.session.user.id,
      type: "booking_cancelled",
      content: `Your booking for ${booking.cars.brand} ${booking.cars.model} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`,
      related_car_id: booking.car_id,
      related_booking_id: booking.id
    }]);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const bookingToCancel = bookings?.find(b => b.id === bookingId);
      if (!bookingToCancel) return;

      // First update the local state optimistically
      queryClient.setQueryData(["bookings"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((booking: any) => 
          booking.id === bookingId 
            ? { ...booking, status: "cancelled" }
            : booking
        );
      });

      // Then update in Supabase
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      if (error) {
        // If there's an error, revert the optimistic update
        await queryClient.invalidateQueries({ queryKey: ["bookings"] });
        throw error;
      }

      // Create notifications about the cancellation
      await createCancellationNotifications(bookingToCancel);

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 space-y-4">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 space-y-4">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={booking.cars.image_url || "/placeholder.svg"}
                        alt={`${booking.cars.brand} ${booking.cars.model}`}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">
                          {booking.cars.brand} {booking.cars.model}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p>{format(new Date(booking.start_date), "PPP")}</p>
                    <p className="text-muted-foreground">
                      to {format(new Date(booking.end_date), "PPP")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{booking.status}</span>
                  </TableCell>
                  <TableCell>BWP {booking.total_price}</TableCell>
                  <TableCell>
                    {booking.status === "pending" && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Bookings;