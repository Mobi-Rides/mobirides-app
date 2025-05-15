
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { HostStats } from "./HostStats";
import { HostTabContent } from "./host/HostTabContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookingStatus } from "@/types/booking";

export const HostDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
            image_url,
            owner_id,
            price_per_day
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
  
  const activeBookings = bookings?.filter(b => 
    b.status === 'confirmed' && // Using string literal for consistency with DB
    new Date(b.start_date) <= today && 
    new Date(b.end_date) >= today
  );
  
  const pendingBookings = bookings?.filter(b => 
    b.status === 'pending' // Using string literal for consistency with DB
  );
  
  const expiredBookings = bookings?.filter(b => 
    b.status === 'expired' // Using string literal for consistency with DB
  );
  
  const completedBookings = bookings?.filter(b => 
    b.status === 'completed' || // Using string literal for consistency with DB
    (b.status === 'confirmed' && new Date(b.end_date) < today)
  );

  const handleCardClick = (bookingId: string) => {
    navigate(`/rental-details/${bookingId}`);
  };

  const handlePendingCardClick = (bookingId: string) => {
    navigate(`/booking-requests/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      <HostStats />
      
      <Tabs defaultValue="active" className="bg-card rounded-lg p-3 sm:p-4 shadow-sm dark:border dark:border-border">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="active">Active Rentals</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="pending">Booking Requests</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="expired">Expired Requests</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="completed">Past Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <HostTabContent 
            bookings={activeBookings} 
            tabType="active" 
            emptyMessage="No active rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>

        <TabsContent value="pending">
          <HostTabContent 
            bookings={pendingBookings} 
            tabType="pending" 
            emptyMessage="No booking requests"
            onCardClick={handlePendingCardClick}
          />
        </TabsContent>

        <TabsContent value="expired">
          <HostTabContent 
            bookings={expiredBookings} 
            tabType="expired" 
            emptyMessage="No expired requests"
            onCardClick={handleCardClick}
          />
        </TabsContent>

        <TabsContent value="completed">
          <HostTabContent 
            bookings={completedBookings} 
            tabType="completed" 
            emptyMessage="No completed rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
