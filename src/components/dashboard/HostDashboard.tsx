import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { HostStats } from "./HostStats";
import { HostTabContent } from "./host/HostTabContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookingStatus } from "@/types/booking";
import { WalletBalanceIndicator } from "./WalletBalanceIndicator";
import { walletService } from "@/services/walletService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus } from "lucide-react";
import { HandoverNotificationCard } from "@/components/handover/HandoverNotificationCard";
import { useHandoverPrompts } from "@/hooks/useHandoverPrompts";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { HostCarCard } from "@/components/host/HostCarCard";
import { toSafeCar } from "@/types/car";
import { Button } from "@/components/ui/button";

export const HostDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Get handover prompts
  const { 
    handoverPrompts, 
    hasHandoverPrompts, 
    hasUrgentPrompts,
    refetch: refetchPrompts 
  } = useHandoverPrompts();
  
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["host-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Fetching host bookings");
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);

      if (carsError) throw carsError;
      if (!cars.length) return [];

      const carIds = cars.map(car => car.id);
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            location,
            image_url,
            owner_id,
            price_per_day
          ),
          renter:profiles!renter_id (
            id,
            full_name
          )
        `)
        .in("car_id", carIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Host bookings:", data);
      return data;
    }
  });

  const { data: hostCars } = useQuery({
    queryKey: ["host-cars"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(car => ({ ...toSafeCar(car as any), view_count: (car as any).view_count || 0 }));
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const today = new Date();
  
  const activeBookings = bookings?.filter(b => 
    b.status === 'confirmed' && // Using string literal for consistency with DB
    new Date(b.start_date) <= today && 
    new Date(b.end_date) >= today
  );
  
  const pendingBookings = bookings?.filter(b => 
    b.status === 'pending' // Using string literal for consistency with DB
  );
  
  const expiredBookings = bookings?.filter(b => 
    b.status === 'expired' // Using string literal for consistency with DB
  );
  
  const completedBookings = bookings?.filter(b => 
    b.status === 'completed' || // Using string literal for consistency with DB
    (b.status === 'confirmed' && new Date(b.end_date) < today)
  );

  const handleCardClick = (bookingId: string) => {
    navigate(`/rental-details/${bookingId}`);
  };

  const handlePendingCardClick = (bookingId: string) => {
    navigate(`/booking-requests/${bookingId}`);
  };

  const currentBalance = walletBalance?.balance || 0;
  const showLowBalanceWarning = currentBalance < 50; // Show warning if balance is below P50

  const handleStartHandover = async (bookingId: string) => {
    try {
      console.log("Starting handover for booking:", bookingId);
      
      // Find the prompt for this booking to get the handover type
      const prompt = handoverPrompts.find(p => p.bookingId === bookingId);
      if (!prompt) {
        throw new Error('Handover prompt not found for this booking');
      }
      
      // Get booking details to find host and renter IDs
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          renter_id,
          cars!inner(owner_id)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      if (!booking) throw new Error('Booking not found');

      const hostId = booking.cars.owner_id;
      const renterId = booking.renter_id;

      // Create handover session with the correct handover type
      const session = await createHandoverSession(bookingId, prompt.handoverType, hostId, renterId);
      
      if (session) {
        toast.success(`${prompt.handoverType === 'pickup' ? 'Pickup' : 'Return'} process started`);
        // Navigate to map with handover mode and the correct handover type
        navigate(`/map?bookingId=${bookingId}&mode=handover&role=host&handoverType=${prompt.handoverType}`);
        refetchPrompts(); // Refresh prompts
      }
    } catch (error) {
      console.error("Error starting handover:", error);
      toast.error("Failed to start handover process");
    }
  };

  return (
    <div className="space-y-6">
      <HostStats />
      
      {/* Handover Prompts */}
      {hasHandoverPrompts && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Action Required</h3>
          {handoverPrompts.map((prompt) => (
            <HandoverNotificationCard
              key={prompt.id}
              prompt={prompt}
              onStartHandover={handleStartHandover}
            />
          ))}
        </div>
      )}
      
      {/* Low Balance Warning */}
      {showLowBalanceWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Low wallet balance (P{currentBalance.toFixed(2)}). You may not be able to accept new booking requests. 
            <span 
              className="underline cursor-pointer ml-1"
              onClick={() => navigate('/wallet')}
            >
              Top up your wallet
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Compact Wallet Balance Indicator */}
      <div className="bg-card rounded-lg p-4 shadow-sm dark:border dark:border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Wallet Balance</h3>
            <p className="text-sm text-muted-foreground">Available for booking commissions</p>
          </div>
          <WalletBalanceIndicator compact={true} />
        </div>
      </div>
      
      <Tabs defaultValue="active" className="bg-card rounded-lg p-3 sm:p-4 shadow-sm dark:border dark:border-border">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="active">Active Rentals</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="pending">Requests</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="vehicles">My Vehicles</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="expired">Expired</TabsTrigger>
          <TabsTrigger className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap" value="completed">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <HostTabContent 
            bookings={activeBookings} 
            tabType="active" 
            emptyMessage="No active rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>

        <TabsContent value="pending">
          <HostTabContent 
            bookings={pendingBookings} 
            tabType="pending" 
            emptyMessage="No booking requests"
            onCardClick={handlePendingCardClick}
          />
        </TabsContent>

        <TabsContent value="vehicles">
          {hostCars?.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
              <p className="text-muted-foreground mb-4">You haven't listed any cars yet.</p>
              <Button onClick={() => navigate('/add-car')}>
                <Plus className="w-4 h-4 mr-2" />
                List Your First Car
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostCars?.map(car => (
                <HostCarCard key={car.id} car={car} />
              ))}
              <div className="flex items-center justify-center h-full min-h-[200px] border-2 border-dashed rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/add-car')}>
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">Add Another Car</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired">
          <HostTabContent 
            bookings={expiredBookings} 
            tabType="expired" 
            emptyMessage="No expired requests"
            onCardClick={handleCardClick}
          />
        </TabsContent>

        <TabsContent value="completed">
          <HostTabContent 
            bookings={completedBookings} 
            tabType="completed" 
            emptyMessage="No completed rentals"
            onCardClick={handleCardClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
