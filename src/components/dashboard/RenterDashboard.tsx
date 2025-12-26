
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { RenterStats } from "./RenterStats";
import { RenterTabContent } from "./renter/RenterTabContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { HandoverNotificationCard } from "@/components/handover/HandoverNotificationCard";
import { useHandoverPrompts } from "@/hooks/useHandoverPrompts";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { Shield, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const RenterDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Get handover prompts
  const {
    handoverPrompts,
    hasHandoverPrompts,
    hasUrgentPrompts,
    refetch: refetchPrompts
  } = useHandoverPrompts();

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
            image_url,
            owner_id,
            price_per_day
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
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

  const handleStartHandover = async (bookingId: string) => {
    try {
      console.log("Starting handover for booking:", bookingId);

      // Get booking details to find host and renter IDs
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          renter_id,
          cars!inner(owner_id)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      if (!booking) throw new Error('Booking not found');

      const hostId = booking.cars.owner_id;
      const renterId = booking.renter_id;

      // Create handover session
      const session = await createHandoverSession(bookingId, 'pickup', hostId, renterId);

      if (session) {
        toast.success("Handover process started");
        // Navigate to map with handover mode
        navigate(`/map?bookingId=${bookingId}&mode=handover&role=renter`);
        refetchPrompts(); // Refresh prompts
      }
    } catch (error) {
      console.error("Error starting handover:", error);
      toast.error("Failed to start handover process");
    }
  };

  return (
    <div className="space-y-6">
      <RenterStats />

      {/* Handover Prompts */}
      {hasHandoverPrompts && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Action Required</h3>
          {handoverPrompts.map((prompt) => (
            <HandoverNotificationCard
              key={prompt.id}
              prompt={prompt}
              onStartHandover={handleStartHandover}
            />
          ))}
        </div>
      )}

      {/* Insurance Quick Link */}
      <Card
        className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors"
        onClick={() => navigate('/insurance/policies')}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 dark:text-indigo-100">My Insurance Policies</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">View and download your coverage certificates</p>
            </div>
          </div>
          <FileText className="h-5 w-5 text-indigo-400" />
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="bg-card rounded-lg p-3 sm:p-4 shadow-sm dark:border dark:border-border">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="active">Active Rentals</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="past">Past Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <RenterTabContent
            bookings={activeBookings}
            tabType="active"
            emptyMessage="No active rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>

        <TabsContent value="upcoming">
          <RenterTabContent
            bookings={upcomingBookings}
            tabType="upcoming"
            emptyMessage="No upcoming rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>

        <TabsContent value="past">
          <RenterTabContent
            bookings={pastBookings}
            tabType="past"
            emptyMessage="No past rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
