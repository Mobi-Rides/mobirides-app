
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarGrid } from "@/components/CarGrid";
import BrandFilter from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import type { Car } from "@/types/car";

interface HostViewProps {
  searchQuery: string;
}

export const HostView = ({ searchQuery }: HostViewProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center ">
        <h3 className="font-bold  break-words line-clamp-2 text-sm md:text-base text-gray-500 dark:text-white">
          Your Fleet
        </h3>

        <span className="ml-2 px-3 py-1 rounded-md text-xs md:text-sm bg-[#F1F0FB] dark:bg-[#352a63] text-[#7C3AED] dark:text-[#a87df8]">
          Host Mode
        </span>
      </div>

      <BrandFilter
        selectedBrand={selectedBrand}
        onSelectBrand={handleBrandSelect}
        carsCount={hostCars.length}
      />

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

      <CarGrid
        cars={hostCars}
        isLoading={hostCarsLoading}
        error={hostCarsError}
        loadMoreRef={() => {}}
        isFetchingNextPage={false}
        isAuthenticated={true}
      />
    </div>
  );
};
