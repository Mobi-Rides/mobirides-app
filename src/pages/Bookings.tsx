
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookingTable } from "@/components/booking/BookingTable";
import { format } from "date-fns";
import { Booking } from "@/types/booking";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const Bookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Current session:", data.session);
    };
    
    checkUser();
  }, []);

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      console.log("Fetching user bookings");
      
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current user session:", sessionData.session);
      
      if (!sessionData.session) {
        throw new Error("No active session found");
      }
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            image_url,
            owner_id,
            location,
            price_per_day
          ),
          reviews!reviews_booking_id_fkey (
            id
          )
        `)
        .eq("renter_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }

      console.log("Bookings fetched:", data);
      return data as unknown as Booking[];
    },
    retry: 2
  });

  const createCancellationNotifications = async (booking: Booking) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    // Use the database function for proper notification handling
    await supabase.rpc('create_booking_notification', {
      p_booking_id: booking.id,
      p_notification_type: 'booking_cancelled',
      p_content: `Booking for ${booking.cars.brand} ${booking.cars.model} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const bookingToCancel = bookings?.find(b => b.id === bookingId);
      if (!bookingToCancel) return;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        throw updateError;
      }

      await createCancellationNotifications(bookingToCancel);

      await queryClient.invalidateQueries({ queryKey: ["bookings"] });

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
        variant: 'default',
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  };

  useEffect(() => {
    if (error) {
      console.error("Booking query error:", error);
      toast({
        title: "Error loading bookings",
        description: "Please try again later or contact support",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (!isLoading && (!bookings || bookings.length === 0)) {
      console.log("No bookings found in the query result");
    }
  }, [bookings, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 space-y-4">
          <div className="px-4 py-4 mb-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl md:text-2xl text-left font-semibold">
              My Booking
            </h1>
          </div>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 space-y-4">
        <div className="px-4 py-4 mb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl text-left font-semibold">
            My Booking
          </h1>
        </div>
        <div className="px-4">
          <BookingTable
            bookings={bookings}
            onCancelBooking={handleCancelBooking}
          />
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Bookings;
