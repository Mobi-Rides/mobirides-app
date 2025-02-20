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
}

export const BrandFilter = ({
  selectedBrand,
  onSelectBrand
}: BrandFilterProps) => {
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleBrand = (brandName: string) => {
    const newSelectedBrands = new Set(selectedBrands);
    if (newSelectedBrands.has(brandName)) {
      newSelectedBrands.delete(brandName);
    } else {
      newSelectedBrands.add(brandName);
    }
    setSelectedBrands(newSelectedBrands);
    
    // If no brands are selected, pass null to show all results
    // Otherwise, pass the first selected brand (maintaining backward compatibility)
    onSelectBrand(newSelectedBrands.size > 0 ? Array.from(newSelectedBrands)[0] : null);
  };

  const isBrandSelected = (brandName: string) => selectedBrands.has(brandName);

  return (
    <div className="space-y-4">
      {isMobile ? (
        <Carousel className="w-full">
          <CarouselContent>
            {defaultBrands.map(brand => (
              <CarouselItem key={brand.id} className="basis-1/3 pl-2">
                <button 
                  onClick={() => toggleBrand(brand.name)} 
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg transition-all w-full",
                    isBrandSelected(brand.name) 
                      ? "bg-primary text-white" 
                      : "bg-secondary hover:bg-accent"
                  )}
                >
                  <img 
                    src={brand.logo_url} 
                    alt={`${brand.name} logo`} 
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-xs mt-2 font-medium">{brand.name}</span>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {defaultBrands.map(brand => (
            <button
              key={brand.id}
              onClick={() => toggleBrand(brand.name)}
              className={cn(
                "flex flex-col items-center min-w-[144px] p-6 rounded-lg transition-all",
                isBrandSelected(brand.name)
                  ? "bg-primary text-white"
                  : "bg-secondary hover:bg-accent"
              )}
            >
              <img
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                className="w-16 h-16 object-contain"
              />
              <span className="text-sm mt-3 font-medium">{brand.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
