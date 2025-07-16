// src/pages/BookingsRouter.tsx

import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import RenterBookings from "@/pages/Bookings"; // Import the  Bookings component
import HostBookings from "@/pages/Bookings"; // Import the HostBookings component
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"; // Reusing dashboard header for consistent look/role switch button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const BookingsRouter = () => {
  const [userRole, setUserRole] = useState<"host" | "renter" | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null); // Or redirect to login
        return;
      }

      console.log("Fetching user role for Bookings Router");
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile for role:", error);
        // Fallback to renter or handle error appropriately
        setUserRole("renter");
        return;
      }

      if (profile?.role) {
        console.log("User role for bookings:", profile.role);
        setUserRole(profile.role);
      } else {
        // Default to renter if no role is defined (or based on your app's logic)
        console.log("No role found, defaulting to renter.");
        setUserRole("renter");
      }
    };

    getUserRole();
  }, []);

  // Show skeleton loading state while determining role
  if (userRole === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" /> {/* Placeholder for title */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Skeleton className="h-10 w-full sm:flex-1" /> {/* Search bar skeleton */}
                <Skeleton className="h-10 w-full sm:w-[180px]" /> {/* Select filter skeleton */}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  // Render the appropriate booking component based on user role
  return (
    <>
      {userRole === "renter" ? <RenterBookings /> : <HostBookings />}
    </>
  );
};

export default BookingsRouter;