
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { RenterStats } from "./RenterStats";
import { RenterTabContent } from "./renter/RenterTabContent";

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

  return (
    <div className="space-y-6">
      <RenterStats />
      
      <Tabs defaultValue="active" className="bg-background rounded-lg p-4 shadow-sm dark:border dark:border-border">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Rentals</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Rentals</TabsTrigger>
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
