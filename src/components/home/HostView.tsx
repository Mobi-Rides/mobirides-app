
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarGrid } from "@/components/CarGrid";
import BrandFilter from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { HandoverBanner } from "@/components/handover/HandoverBanner";
import { useHandoverPrompts } from "@/hooks/useHandoverPrompts";
import { useNavigate } from "react-router-dom";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import type { Car } from "@/types/car";

interface HostViewProps {
  searchQuery: string;
}

export const HostView = ({ searchQuery }: HostViewProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Get handover prompts for this host
  const { 
    handoverPrompts, 
    hasHandoverPrompts, 
    hasUrgentPrompts,
    refetch: refetchPrompts 
  } = useHandoverPrompts();

  const { 
    data: hostCarsData, 
    isLoading: hostCarsLoading,
    error: hostCarsError
  } = useQuery({
    queryKey: ['host-cars', searchQuery, sortOrder, selectedBrand],
    queryFn: async () => {
      console.log("Fetching host cars with search:", searchQuery, "brand:", selectedBrand);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      
      let query = supabase
        .from('cars')
        .select('*')
        .eq('owner_id', session.user.id);

      if (searchQuery) {
        query = query.or(`brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`);
      }
      
      if (selectedBrand) {
        query = query.eq('brand', selectedBrand);
      }

      query = query.order('price_per_day', { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      console.log("Host cars fetched:", data);
      return data as Car[];
    }
  });

  const hostCars = hostCarsData || [];
  
  const handleBrandSelect = (brand: string | null) => {
    console.log("Host view brand selected:", brand);
    setSelectedBrand(brand);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  const handleLoadMore = () => {
    // Load more logic would go here
    console.log("Load more triggered in HostView");
  };

  const handleStartHandover = async (bookingId: string) => {
    try {
      console.log("Starting handover for booking:", bookingId);
      
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

      // Create handover session
      const session = await createHandoverSession(bookingId, hostId, renterId, 'pickup');
      
      if (session) {
        toast.success("Handover process started");
        // Navigate to map with handover mode
        navigate(`/map?bookingId=${bookingId}&mode=handover&role=host`);
        refetchPrompts(); // Refresh prompts
      }
    } catch (error) {
      console.error("Error starting handover:", error);
      toast.error("Failed to start handover process");
    }
  };

  return (
    <div className="space-y-6">
      {/* Handover Prompts */}
      {hasHandoverPrompts && (
        <div className="space-y-3">
          {handoverPrompts.map((prompt) => (
            <HandoverBanner
              key={prompt.id}
              prompt={prompt}
              onStartHandover={handleStartHandover}
            />
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button
          variant={sortOrder ? "secondary" : "outline"}
          onClick={toggleSortOrder}
          className={`flex items-center gap-2 transition-colors ${
            sortOrder ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          {sortOrder === "asc" ? (
            <>
              Price: Low to High
              <ArrowUpAZ className="h-4 w-4" />
            </>
          ) : (
            <>
              Price: High to Low
              <ArrowDownAZ className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      
      <div className="text-left flex items-center ">
        <h3 className="font-bold  break-words line-clamp-2 text-sm md:text-base text-gray-500 dark:text-white">
          My Cars
        </h3>
      </div>
      <CarGrid
        cars={hostCars}
        isLoading={hostCarsLoading}
        error={hostCarsError}
        loadMoreRef={loadMoreRef}
        onLoadMore={handleLoadMore}
        isFetchingNextPage={false}
        isAuthenticated={true}
      />
    </div>
  );
};
