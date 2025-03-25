
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { HostStats } from "./HostStats";
import { HostTabContent } from "./host/HostTabContent";

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

  const handlePendingCardClick = (bookingId: string) => {
    navigate(`/booking-requests/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      <HostStats />
      
      <Tabs defaultValue="active" className="bg-background rounded-lg p-4 shadow-sm dark:border dark:border-border">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Rentals</TabsTrigger>
          <TabsTrigger value="pending">Booking Requests</TabsTrigger>
          <TabsTrigger value="completed">Past Rentals</TabsTrigger>
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
