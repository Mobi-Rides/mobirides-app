import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { defaultBrands } from "@/integrations/supabase/types";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useMediaQuery } from "@/hooks/use-mobile";

interface BrandFilterProps {
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
  carsCount?: number;
}

export const BrandFilter = ({
  selectedBrand,
  onSelectBrand,
  carsCount = 0
}: BrandFilterProps) => {
  // Initialize state based on the incoming selectedBrand prop
  const [activeSelection, setActiveSelection] = useState<string | null>(selectedBrand);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showNoCarsMessage, setShowNoCarsMessage] = useState(false);

  // Update state when prop changes
  useEffect(() => {
    setActiveSelection(selectedBrand);
  }, [selectedBrand]);

  // Check if we need to show the no cars message
  useEffect(() => {
    // Only show message if a brand is selected and there are no cars
    setShowNoCarsMessage(!!activeSelection && carsCount === 0);
  }, [activeSelection, carsCount]);

  const handleBrandClick = (brandName: string) => {
    // If clicking the already selected brand, clear the selection
    if (activeSelection === brandName) {
      setActiveSelection(null);
      onSelectBrand(null);
    } 
    // Otherwise, select the new brand
    else {
      setActiveSelection(brandName);
      onSelectBrand(brandName);
    }
  };

  return (
    <div className="space-y-4">
      {isMobile ? (
        <Carousel className="w-full">
          <CarouselContent>
            {defaultBrands.map(brand => (
              <CarouselItem key={brand.id} className="basis-1/4 pl-2">
                <button 
                  onClick={() => handleBrandClick(brand.name)} 
                  className={cn(
                    "flex items-center justify-center aspect-square rounded-full transition-all w-20 h-20 mx-auto",
                    activeSelection === brand.name
                      ? "border-2 border-primary shadow-sm" 
                      : "border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                  title={brand.name}
                >
                  <img 
                    src={brand.logo_url} 
                    alt={`${brand.name} logo`} 
                    className={cn(
                      "w-12 h-12 object-contain",
                      activeSelection === brand.name ? "opacity-100" : "opacity-70 hover:opacity-100"
                    )}
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {defaultBrands.map(brand => (
            <button
              key={brand.id}
              onClick={() => handleBrandClick(brand.name)}
              className={cn(
                "flex items-center justify-center aspect-square rounded-full transition-all w-24 h-24",
                activeSelection === brand.name
                  ? "border-2 border-primary shadow-sm" 
                  : "border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
              )}
              title={brand.name}
            >
              <img
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                className={cn(
                  "w-14 h-14 object-contain",
                  activeSelection === brand.name ? "opacity-100" : "opacity-70 hover:opacity-100"
                )}
              />
            </button>
          ))}
        </div>
      )}
      
      {showNoCarsMessage && (
        <div className="w-full py-8 px-4 text-center rounded-lg bg-muted/30 dark:bg-gray-800/50">
          <p className="text-muted-foreground dark:text-gray-400">
            No cars available for {activeSelection}. Try another brand or clear the filter.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setActiveSelection(null);
              onSelectBrand(null);
            }}
            className="mt-2"
          >
            Clear Filter
          </Button>
        </div>
      )}
    </div>
  );
};
