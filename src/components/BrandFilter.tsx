import { useState } from "react";
import { cn } from "@/lib/utils";
import { defaultBrands } from "@/integrations/supabase/types";
import { Button } from "./ui/button";

interface BrandFilterProps {
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}

export const BrandFilter = ({
  selectedBrand,
  onSelectBrand,
}: BrandFilterProps) => {
  const [showAll, setShowAll] = useState(false);
  console.log("Rendering BrandFilter with brands:", defaultBrands);
  
  // Initially show only 5 brands
  const visibleBrands = showAll ? defaultBrands : defaultBrands.slice(0, 5);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {visibleBrands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => onSelectBrand(brand.name === selectedBrand ? null : brand.name)}
            className={cn(
              "flex flex-col items-center min-w-[144px] p-6 rounded-lg transition-all", // Doubled size from 72px to 144px, increased padding
              selectedBrand === brand.name
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-accent"
            )}
          >
            <img
              src={brand.logo_url}
              alt={`${brand.name} logo`}
              className="w-16 h-16 object-contain" // Doubled size from 8 to 16
            />
            <span className="text-sm mt-3 font-medium">{brand.name}</span>
          </button>
        ))}
      </div>
      
      {defaultBrands.length > 5 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-primary"
          >
            {showAll ? "Show Less" : "See All"}
          </Button>
        </div>
      )}
    </div>
  );
};