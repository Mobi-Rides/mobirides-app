
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Car, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const RenterBookingStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["renter-booking-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, start_date, end_date")
        .eq("renter_id", user.id);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const total = bookings.length;
      const active = bookings.filter(b => 
        b.status === "confirmed" && 
        new Date(b.start_date) <= today && 
        new Date(b.end_date) >= today
      ).length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const pending = bookings.filter(b => b.status === "pending").length;

      return { total, active, completed, pending };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.total || 0,
      icon: Car,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Trips",
      value: stats?.active || 0,
      icon: CalendarClock,
      iconColor: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      icon: CheckCircle,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {stat.title}
                </p>
                <p className="text-lg font-bold">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
