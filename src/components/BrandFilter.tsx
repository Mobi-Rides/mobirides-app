
import React, { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define the list of default brands
const defaultBrands = [
  "Toyota",
  "Honda",
  "Nissan",
  "Ford",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
  "Hyundai",
  "Kia",
  "Chevrolet",
  "Lexus",
  "Mazda",
  "Subaru",
  "Tesla"
];

interface BrandFilterProps {
  // For multi-select mode
  selectedBrands?: string[];
  onBrandsChange?: (brands: string[]) => void;
  
  // For single-select mode
  selectedBrand?: string | null;
  onSelectBrand?: (brand: string | null) => void;
  
  // Additional props
  carsCount?: number;
}

const BrandFilter = ({ 
  selectedBrands = [],
  onBrandsChange,
  selectedBrand,
  onSelectBrand,
  carsCount
}: BrandFilterProps) => {
  const [open, setOpen] = useState(false);
  const [localSelectedBrands, setLocalSelectedBrands] = useState<string[]>(selectedBrands);
  
  // Determine if we're in single or multi-select mode
  const isSingleSelectMode = !!onSelectBrand;
  
  // Update local state when props change
  useEffect(() => {
    if (!isSingleSelectMode) {
      setLocalSelectedBrands(selectedBrands);
    }
  }, [selectedBrands, isSingleSelectMode]);

  // Handle selection based on the component's mode
  const handleBrandSelect = (brand: string) => {
    if (isSingleSelectMode) {
      // Single select mode
      onSelectBrand?.(selectedBrand === brand ? null : brand);
      setOpen(false);
    } else {
      // Multi-select mode
      const isSelected = localSelectedBrands.includes(brand);
      const updatedBrands = isSelected 
        ? localSelectedBrands.filter((b) => b !== brand)
        : [...localSelectedBrands, brand];
        
      setLocalSelectedBrands(updatedBrands);
    }
  };

  // Apply filters in multi-select mode
  const applyFilters = () => {
    if (onBrandsChange) {
      onBrandsChange(localSelectedBrands);
    }
    setOpen(false);
  };

  // Display text based on mode
  const displayText = () => {
    if (isSingleSelectMode && selectedBrand) {
      return selectedBrand;
    } else if (!isSingleSelectMode && localSelectedBrands.length > 0) {
      return `${localSelectedBrands.length} brand${localSelectedBrands.length > 1 ? 's' : ''} selected`;
    }
    return "Select Brand";
  };

  // Check if a brand is selected based on the current mode
  const isBrandSelected = (brand: string) => {
    return isSingleSelectMode
      ? selectedBrand === brand
      : localSelectedBrands.includes(brand);
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {displayText()}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search brand..." />
              <CommandList>
                <CommandEmpty>No brand found.</CommandEmpty>
                <CommandGroup>
                  {defaultBrands.map((brand) => (
                    <CommandItem
                      key={brand}
                      onSelect={() => handleBrandSelect(brand)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isBrandSelected(brand) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {brand}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {!isSingleSelectMode && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={applyFilters}>
                        Apply Filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {carsCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {carsCount} car{carsCount !== 1 ? "s" : ""} available
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandFilter;
