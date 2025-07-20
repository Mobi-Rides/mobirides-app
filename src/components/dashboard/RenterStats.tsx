
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { CalendarClock, Car, CheckCircle, Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const RenterStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["renter-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      // Get all bookings for this renter
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, start_date, end_date")
        .eq("renter_id", user.id);

      if (error) throw error;

      // Calculate stats with proper date validation for active trips
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const total = bookings.length;
      const active = bookings.filter(b => 
        b.status === "confirmed" && 
        new Date(b.start_date) <= today && 
        new Date(b.end_date) >= today
      ).length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const cancelled = bookings.filter(b => b.status === "cancelled").length;
      const pending = bookings.filter(b => b.status === "pending").length;

      return { total, active, completed, cancelled, pending };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatsCard 
        title="Total Bookings" 
        value={stats?.total || 0}
        icon={Car}
      />
      <StatsCard 
        title="Active Trips" 
        value={stats?.active || 0}
        icon={CalendarClock}
        iconClassName="bg-blue-500"
      />
      <StatsCard 
        title="Completed Trips" 
        value={stats?.completed || 0}
        icon={CheckCircle}
        iconClassName="bg-green-500"
      />
      <StatsCard 
        title="Pending Bookings" 
        value={stats?.pending || 0}
        icon={Clock}
        iconClassName="bg-amber-500"
      />
    </div>
  );
};
