import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, CreditCard, AlertTriangle, Wallet, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStatsData {
  totalUsers: number;
  totalCars: number;
  totalBookings: number;
  pendingVerifications: number;
  grossRevenue: number;
  platformRevenue: number;
  hostRevenue: number;
}

const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStatsData> => {
      const [usersResult, carsResult, bookingsResult, verificationsResult, revenueResult] = 
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase.from("user_verifications").select("id", { count: "exact", head: true }).neq("overall_status", "completed"),
          supabase.from("bookings").select("total_price").in("status", ["completed", "confirmed"])
        ]);

      const grossRevenue = revenueResult.data?.reduce((sum, booking) => 
        sum + Number(booking.total_price), 0) || 0;

      const COMMISSION_RATE = 0.15;
      const platformRevenue = grossRevenue * COMMISSION_RATE;
      const hostRevenue = grossRevenue * (1 - COMMISSION_RATE);

      return {
        totalUsers: usersResult.count || 0,
        totalCars: carsResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        pendingVerifications: verificationsResult.count || 0,
        grossRevenue,
        platformRevenue,
        hostRevenue
      };
    },
  });
};

export const AdminStats = () => {
  const { data: stats, isLoading, error } = useAdminStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load admin statistics</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Registered users",
      onClick: () => navigate("/admin/users")
    },
    {
      title: "Total Cars",
      value: stats?.totalCars || 0,
      icon: Car,
      description: "Listed vehicles",
      onClick: () => navigate("/admin/cars")
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: CreditCard,
      description: "All bookings",
      onClick: () => navigate("/admin/bookings")
    },
    {
      title: "Pending Verifications",
      value: stats?.pendingVerifications || 0,
      icon: AlertTriangle,
      description: "Awaiting review",
      onClick: () => navigate("/admin/verifications")
    },
    {
      title: "Gross Revenue",
      value: `P${(stats?.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      description: "Total booking value",
      onClick: () => navigate("/admin/transactions")
    },
    {
      title: "Host Earnings",
      value: `P${(stats?.hostRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: "85% to hosts",
      onClick: () => navigate("/admin/transactions")
    },
    {
      title: "Platform Commission",
      value: `P${(stats?.platformRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
      description: "15% platform fee",
      onClick: () => navigate("/admin/transactions")
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={stat.onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold hover:text-primary transition-colors">
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};