import { cn } from "@/lib/utils";
import { defaultBrands } from "@/integrations/supabase/types";

interface BrandFilterProps {
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}

export const BrandFilter = ({
  selectedBrand,
  onSelectBrand,
}: BrandFilterProps) => {
  console.log("Rendering BrandFilter with brands:", defaultBrands);
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {defaultBrands.map((brand) => (
        <button
          key={brand.id}
          onClick={() => onSelectBrand(brand.name === selectedBrand ? null : brand.name)}
          className={cn(
            "flex flex-col items-center min-w-[72px] p-3 rounded-lg transition-all",
            selectedBrand === brand.name
              ? "bg-primary text-white"
              : "bg-secondary hover:bg-accent"
          )}
        >
          <img
            src={brand.logo_url}
            alt={`${brand.name} logo`}
            className="w-8 h-8 object-contain"
          />
          <span className="text-xs mt-2 font-medium">{brand.name}</span>
        </button>
      ))}
    </div>
  );
};