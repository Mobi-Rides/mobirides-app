import { cn } from "@/lib/utils";

interface Brand {
  name: string;
  logo: string;
}

interface BrandFilterProps {
  brands: Brand[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}

export const BrandFilter = ({
  brands,
  selectedBrand,
  onSelectBrand,
}: BrandFilterProps) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {brands.map((brand) => (
        <button
          key={brand.name}
          onClick={() => onSelectBrand(brand.name === selectedBrand ? null : brand.name)}
          className={cn(
            "flex flex-col items-center min-w-[72px] p-3 rounded-lg transition-all",
            selectedBrand === brand.name
              ? "bg-primary text-white"
              : "bg-secondary hover:bg-accent"
          )}
        >
          <img
            src={brand.logo}
            alt={brand.name}
            className="w-8 h-8 object-contain"
          />
          <span className="text-xs mt-2">{brand.name}</span>
        </button>
      ))}
    </div>
  );
};