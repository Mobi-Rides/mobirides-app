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

const defaultBrands: Brand[] = [
  {
    name: "Toyota",
    logo: "/lovable-uploads/e68159b2-790d-477d-ac9f-a4d618ad5137.png"
  },
  {
    name: "Honda",
    logo: "/lovable-uploads/4d0e305b-d93c-433b-ab24-54ab59b56cd9.png"
  },
  {
    name: "BMW",
    logo: "/lovable-uploads/a4dd6d94-a886-4f07-a237-9428b128b1e3.png"
  },
  {
    name: "Ford",
    logo: "/lovable-uploads/f912a336-76af-4364-afe8-a81133c45845.png"
  },
  {
    name: "Audi",
    logo: "/lovable-uploads/3614aa6e-77ab-44f2-ac12-2909809ba782.png"
  },
  {
    name: "Mercedes",
    logo: "/lovable-uploads/5db2a3dd-0313-4674-ba80-97d005b1cfff.png"
  }
];

export const BrandFilter = ({
  brands = defaultBrands,
  selectedBrand,
  onSelectBrand,
}: BrandFilterProps) => {
  console.log("Rendering BrandFilter with brands:", brands);
  
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
            alt={`${brand.name} logo`}
            className="w-8 h-8 object-contain"
          />
          <span className="text-xs mt-2 font-medium">{brand.name}</span>
        </button>
      ))}
    </div>
  );
};