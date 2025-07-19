
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingWithRelations } from "@/types/booking";
import { 
  CalendarClock, 
  CarFront, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp
} from "lucide-react";

interface HostBookingStatsProps {
  bookings: BookingWithRelations[] | undefined;
}

export const HostBookingStats = ({ bookings }: HostBookingStatsProps) => {
  const stats = useMemo(() => {
    if (!bookings) return {
      totalBookings: 0,
      activeRentals: 0,
      pendingRequests: 0,
      completedRentals: 0,
      totalRevenue: 0,
      netRevenue: 0
    };

    const today = new Date();
    const commissionRate = 0.15;

    const activeRentals = bookings.filter(b => 
      b.status === 'confirmed' && 
      new Date(b.start_date) <= today && 
      new Date(b.end_date) >= today
    ).length;

    const pendingRequests = bookings.filter(b => b.status === 'pending').length;
    
    const completedRentals = bookings.filter(b => 
      b.status === 'completed' || 
      (b.status === 'confirmed' && new Date(b.end_date) < today)
    ).length;

    const totalRevenue = bookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0);

    const netRevenue = totalRevenue * (1 - commissionRate);

    return {
      totalBookings: bookings.length,
      activeRentals,
      pendingRequests,
      completedRentals,
      totalRevenue,
      netRevenue
    };
  }, [bookings]);

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: CarFront,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Rentals",
      value: stats.activeRentals,
      icon: CalendarClock,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Completed",
      value: stats.completedRentals,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Total Revenue",
      value: `BWP ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      title: "Net Earnings",
      value: `BWP ${stats.netRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
