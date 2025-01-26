import { cn } from "@/lib/utils";

interface Brand {
  name: string;
  logo: string;
}

interface BrandFilterProps {
  brands?: Brand[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}

const defaultBrands: Brand[] = [
  {
    name: "Toyota",
    logo: "/lovable-uploads/31367394-9fa8-4403-bf56-effabd0dbcd7.png"
  },
  {
    name: "BMW",
    logo: "/lovable-uploads/d288dd7e-4953-4114-8c21-d4b4573686bf.png"
  },
  {
    name: "Ford",
    logo: "/lovable-uploads/e5bdd673-275b-4080-b16e-61c2d59f2de5.png"
  },
  {
    name: "Mercedes",
    logo: "/lovable-uploads/fd57c122-c300-4f20-a95c-377836bc6722.png"
  },
  {
    name: "Range Rover",
    logo: "/lovable-uploads/20413623-c36b-434d-a57f-fee1f63c4915.png"
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