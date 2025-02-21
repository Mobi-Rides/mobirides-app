
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type RentalBooking = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  cars: {
    brand: string;
    model: string;
    location: string;
  };
  renter: {
    full_name: string;
    avatar_url: string | null;
  };
};

export const HostDashboard = () => {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["host-rentals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Fetching host rentals");
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            location
          ),
          renter:profiles!renter_id (
            full_name,
            avatar_url
          )
        `)
        .eq("cars.owner_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      console.log("Host rentals:", data);
      return data as RentalBooking[];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const activeRentals = bookings?.filter(b => b.status === "confirmed" && new Date(b.end_date) >= new Date());
  const upcomingRentals = bookings?.filter(b => b.status === "pending");
  const pastRentals = bookings?.filter(b => 
    b.status === "completed" || 
    (b.status === "confirmed" && new Date(b.end_date) < new Date())
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Rentals</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4">
            {activeRentals?.map((rental) => (
              <Card key={rental.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {rental.cars.brand} {rental.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {rental.cars.location}
                    </p>
                    <p className="text-sm">
                      Start: {format(new Date(rental.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      End: {format(new Date(rental.end_date), "PPP")}
                    </p>
                    <p className="text-sm font-medium">
                      Renter: {rental.renter.full_name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-4">
            {upcomingRentals?.map((rental) => (
              <Card key={rental.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {rental.cars.brand} {rental.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {rental.cars.location}
                    </p>
                    <p className="text-sm">
                      Start: {format(new Date(rental.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      End: {format(new Date(rental.end_date), "PPP")}
                    </p>
                    <p className="text-sm font-medium">
                      Renter: {rental.renter.full_name}
                    </p>
                    <p className="text-sm font-medium">Status: {rental.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-4">
            {pastRentals?.map((rental) => (
              <Card key={rental.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {rental.cars.brand} {rental.cars.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Location: {rental.cars.location}
                    </p>
                    <p className="text-sm">
                      Start: {format(new Date(rental.start_date), "PPP")}
                    </p>
                    <p className="text-sm">
                      End: {format(new Date(rental.end_date), "PPP")}
                    </p>
                    <p className="text-sm font-medium">
                      Renter: {rental.renter.full_name}
                    </p>
                    <p className="text-sm font-medium">Status: {rental.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
