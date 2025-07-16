
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { CalendarClock, CarFront, CheckCircle, Clock, 
  Wallet, //Import Wallet icon for revenue
  Car,  } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react"; // B1.2

export const HostStats = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["host-stats"],
    queryFn: async () => {
      const { data: { user } = {} } = await supabase.auth.getUser();
      // B1.2: 
      // --- DEBUGGING START ---
      console.log("--- HostStats Query Debugging ---");
      console.log("Current Authenticated User ID:", user?.id);
      // --- DEBUGGING END ---
      
      if (!user) {
        // Return default stats including 0 for new metrics if no user
        return { total: 0,
          active: 0, // 'active' will be date-based current rentals
          confirmed: 0, // Renamed 'confirmed' to keep track of all confirmed bookings if needed
          completed: 0, cancelled: 0, pending: 0, totalRevenue: 0, totalCars: 0,
        };
      }

      // 1. Get cars owned by the user (fetching price_per_day)
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id, price_per_day")  //B1.2: include price_per_day
        .eq("owner_id", user.id);

      if (carsError) throw carsError;
      const totalCars = cars.length; // B1.2: Count total cars
      if (!cars.length) {return { total: 0, confirmed: 0, completed: 0, cancelled: 0, pending: 0, totalRevenue: 0, totalCars: totalCars }; }
      // B1.2: Calculate total revenue

      const carIds = cars.map(car => car.id);
      const carPriceMap = new Map(cars.map((car) => [car.id, car.price_per_day]));

      //2. Get all bookings for these cars
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, start_date, end_date, car_id")
        .in("car_id", carIds)

      if (error) throw error;
      // 3. Calculate enhanced stats
      const today = new Date();
      let total = bookings.length;
      let activeRentals = 0; // Represents currently ongoing rentals
      let confirmedBookings = 0; // Represents all confirmed bookings regardless of date
      let pending = 0;
      let completed = 0;
      let cancelled = 0;
      let totalRevenue = 0;

      bookings.forEach((booking) => {   // count statuses
        switch (booking.status) {
          case "confirmed":
            confirmedBookings++;
            // if (new Date(booking.start_date) <= today && new Date(booking.end_date) >= today) {
            //   activeRentals++; // Count as active if current date is within the rental period
            // }
            break;
          case "completed":
            completed++;
            break;
          case "cancelled":
            cancelled++;
            break;
          case "pending":
            pending++;
            break;
          default:
            break;
        }
      // B1.2: Calculate Active Rentals (currently ongoing)
        if (
          booking.status === "confirmed" &&
          booking.start_date &&
          booking.end_date
        ) {
          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          // Check if today falls within the booking period (inclusive of start and end)
          if (startDate <= today && endDate >= today) {
            activeRentals++;
          }
        }
        // B1.2: Calculate Total Revenue (from completed bookings)
        if (
          booking.status === "completed" &&
          booking.start_date &&
          booking.end_date
        ) {
          const pricePerDay = carPriceMap.get(booking.car_id);
          if (pricePerDay) {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            // Calculate number of full days between start and end date
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);
            totalRevenue += pricePerDay * diffDays;
          }
        }
      });
      // B1.2
      return {
        total,
        active: activeRentals,
        confirmed: confirmedBookings, // Keeping this for comparison, but 'active' is the primary "Active Rentals"
        completed,
        cancelled,
        pending,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)), // Format to 2 decimal places as a number
        totalCars,
      };
    },
  });

  // Use a memoized object for stats to ensure stable reference for display
  const stats = useMemo(
    () =>
      statsData || {
        total: 0,
        active: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        totalRevenue: 0,
        totalCars: 0,
      },
    [statsData]
  );
   // Determine number of skeleton cards needed (e.g., 6 for all stats now)
  const numberOfStatCards = 6;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(numberOfStatCards)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6 lg:flex lg:overflow-x-auto lg:flex-nowrap lg:pb-4 lg:scrollbar-hide"> */}
      <StatsCard 
        title="Total Bookings" 
        value={stats.total}
        icon={CarFront}
        iconClassName="bg-purple-500" // Added a default color
      />
      {/* B1.2: new stats card */}
      <StatsCard
        title="My Cars" // B1.2: New stat card for total cars
        value={stats.totalCars}
        icon={Car} // Using a different car icon for clarity
        iconClassName="bg-indigo-500"
      />
      <StatsCard 
        title="Active Rentals" 
        value={stats.active}     // B1.2: now truly reflects active rentals
        icon={CalendarClock}
        iconClassName="bg-blue-500"
      />
      <StatsCard 
        title="Pending Requests" 
        value={stats.pending}
        icon={Clock}
        iconClassName="bg-amber-500"
      />
      <StatsCard 
        title="Completed Rentals" 
        value={stats.completed}
        icon={CheckCircle}
        iconClassName="bg-green-500"
      />
      <StatsCard
        title="Total Revenue" // B1.2: New stat card for total revenue
        value={`P${stats.totalRevenue.toFixed(2)}`} // Format as currency
        icon={Wallet}
        iconClassName="bg-purple-500"
      />
    </div>
  );
};
