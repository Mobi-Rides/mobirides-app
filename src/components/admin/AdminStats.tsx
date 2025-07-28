import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, CreditCard, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStatsData {
  totalUsers: number;
  totalCars: number;
  totalBookings: number;
  pendingVerifications: number;
  totalRevenue: number;
}

const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStatsData> => {
      const [usersResult, carsResult, bookingsResult, verificationsResult, transactionsResult] = 
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase.from("user_verifications").select("id", { count: "exact", head: true }).neq("overall_status", "verified"),
          supabase.from("wallet_transactions").select("amount").eq("status", "completed")
        ]);

      const totalRevenue = transactionsResult.data?.reduce((sum, transaction) => 
        sum + Number(transaction.amount), 0) || 0;

      return {
        totalUsers: usersResult.count || 0,
        totalCars: carsResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        pendingVerifications: verificationsResult.count || 0,
        totalRevenue
      };
    },
  });
};

export const AdminStats = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(5)].map((_, i) => (
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
      description: "Registered users"
    },
    {
      title: "Total Cars",
      value: stats?.totalCars || 0,
      icon: Car,
      description: "Listed vehicles"
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: CreditCard,
      description: "All bookings"
    },
    {
      title: "Pending Verifications",
      value: stats?.pendingVerifications || 0,
      icon: AlertTriangle,
      description: "Awaiting review"
    },
    {
      title: "Total Revenue",
      value: `P${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: CreditCard,
      description: "Platform revenue"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};