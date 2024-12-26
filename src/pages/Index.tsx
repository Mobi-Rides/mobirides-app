import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CarCard } from "@/components/CarCard";
import { BrandFilter } from "@/components/BrandFilter";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Fetch cars from Supabase
const fetchCars = async () => {
  console.log("Fetching cars from Supabase...");
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cars:", error);
    throw error;
  }

  console.log("Cars fetched successfully:", data);
  return data;
};

// Get unique brands from cars
const getUniqueBrands = (cars: any[]) => {
  const brands = [...new Set(cars.map(car => car.brand))];
  return brands.map(name => ({
    name,
    logo: "/placeholder.svg" // You can update this with real logos later
  }));
};

const Index = () => {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cars = [], isLoading, error } = useQuery({
    queryKey: ["cars"],
    queryFn: fetchCars,
  });

  console.log("Current state:", { cars, isLoading, error, selectedBrand, searchQuery });

  const brands = cars.length > 0 ? getUniqueBrands(cars) : [];

  const filteredCars = cars.filter((car) => {
    const matchesBrand = !selectedBrand || car.brand === selectedBrand;
    const matchesSearch =
      !searchQuery ||
      car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  // Loading skeleton for cars
  const CarSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Gaborone, Botswana</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/add-car")}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xl">🔔</span>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Brands</h2>
            <button className="text-primary text-sm">See All</button>
          </div>
          <BrandFilter
            brands={brands}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
          />
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Available Cars</h2>
            <button className="text-primary text-sm">See All</button>
          </div>
          
          {error ? (
            <div className="text-center py-8 text-red-500">
              Error loading cars. Please try again later.
            </div>
          ) : isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <CarSkeleton key={i} />
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cars found matching your criteria.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  brand={car.brand}
                  model={car.model}
                  price={car.price_per_day}
                  image={car.image_url || "/placeholder.svg"}
                  rating={4.5} // We'll implement real ratings later
                  transmission={car.transmission}
                  fuel={car.fuel}
                  seats={car.seats}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Navigation />
    </div>
  );
};

export default Index;