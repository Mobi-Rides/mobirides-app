
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { CalendarClock, CarFront, CheckCircle, Clock, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, XAxis, YAxis, CartesianGrid, Bar, Legend } from "recharts";

const chartConfig = {
  total: { label: "Total Bookings", color: "hsl(var(--primary))" },
  confirmed: { label: "Confirmed", color: "hsl(var(--chart-1))" },
  pending: { label: "Pending", color: "hsl(var(--chart-2))" },
  completed: { label: "Completed", color: "hsl(var(--chart-3))" },
  cancelled: { label: "Cancelled", color: "hsl(var(--chart-4))" },
  earlyReturn: { label: "Early Returns", color: "hsl(var(--chart-5))" },
};

export const HostStats = () => {
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
      if (!cars.length) return { total: 0, confirmed: 0, completed: 0, cancelled: 0, pending: 0, earlyReturn: 0 };

      const carIds = cars.map(car => car.id);
      
      // Get all bookings for these cars
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, early_return")
        .in("car_id", carIds);

      if (error) throw error;

      // Calculate stats
      const total = bookings.length;
      const confirmed = bookings.filter(b => b.status === "confirmed").length;
      const pending = bookings.filter(b => b.status === "pending").length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const cancelled = bookings.filter(b => b.status === "cancelled").length;
      const earlyReturn = bookings.filter(b => b.early_return === true).length;

      return { total, confirmed, completed, cancelled, pending, earlyReturn };
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

  const chartData = [
    { name: "Total", value: stats?.total || 0, fill: "var(--color-total)" },
    { name: "Confirmed", value: stats?.confirmed || 0, fill: "var(--color-confirmed)" },
    { name: "Pending", value: stats?.pending || 0, fill: "var(--color-pending)" },
    { name: "Completed", value: stats?.completed || 0, fill: "var(--color-completed)" },
    { name: "Cancelled", value: stats?.cancelled || 0, fill: "var(--color-cancelled)" },
    { name: "Early Returns", value: stats?.earlyReturn || 0, fill: "var(--color-earlyReturn)" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
        <StatsCard 
          title="Early Returns" 
          value={stats?.earlyReturn || 0}
          icon={RotateCcw}
          iconClassName="bg-purple-500"
        />
      </div>

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="value" radius={8} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};
