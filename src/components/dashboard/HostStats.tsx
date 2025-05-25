
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { CalendarClock, CarFront, CheckCircle, Clock, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { walletService } from "@/services/walletService";

export const HostStats = () => {
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user;
    }
  });

  const { data: walletBalance } = useQuery({
    queryKey: ["wallet-balance", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      return await walletService.getWalletBalance(currentUser.id);
    },
    enabled: !!currentUser?.id
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["host-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Get cars owned by the user
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);

      if (carsError) throw carsError;
      if (!cars.length) return { total: 0, confirmed: 0, completed: 0, cancelled: 0, pending: 0 };

      const carIds = cars.map(car => car.id);
      
      // Get all bookings for these cars
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status")
        .in("car_id", carIds);

      if (error) throw error;

      // Calculate stats
      const total = bookings.length;
      const confirmed = bookings.filter(b => b.status === "confirmed").length;
      const pending = bookings.filter(b => b.status === "pending").length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const cancelled = bookings.filter(b => b.status === "cancelled").length;

      return { total, confirmed, completed, cancelled, pending };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const balance = walletBalance?.balance || 0;
  const isLowBalance = balance < 50;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatsCard 
        title="Wallet Balance" 
        value={`$${balance.toFixed(2)}`}
        icon={Wallet}
        iconClassName={isLowBalance ? "bg-amber-500" : "bg-green-500"}
        description={isLowBalance ? "Low balance" : "Available"}
      />
      <StatsCard 
        title="Total Bookings" 
        value={stats?.total || 0}
        icon={CarFront}
      />
      <StatsCard 
        title="Active Rentals" 
        value={stats?.confirmed || 0}
        icon={CalendarClock}
        iconClassName="bg-blue-500"
      />
      <StatsCard 
        title="Completed" 
        value={stats?.completed || 0}
        icon={CheckCircle}
        iconClassName="bg-green-500"
      />
      <StatsCard 
        title="Pending Requests" 
        value={stats?.pending || 0}
        icon={Clock}
        iconClassName="bg-amber-500"
      />
    </div>
  );
};
