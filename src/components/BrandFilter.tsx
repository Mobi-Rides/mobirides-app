
import React, { useState } from "react";
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

// Define the list of default brands locally instead of importing from types
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
  brands?: string[];
  onChange?: (brands: string[]) => void;
  selectedBrand?: string | null;
  onSelectBrand?: (brand: string | null) => void;
  carsCount?: number;
}

const BrandFilter = ({ 
  brands = [], 
  onChange,
  selectedBrand,
  onSelectBrand,
  carsCount
}: BrandFilterProps) => {
  const [open, setOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState(brands);

  // Handle selection based on the component's mode (multi-select or single-select)
  const handleBrandSelect = (brand: string) => {
    if (onSelectBrand) {
      // Single select mode
      onSelectBrand(selectedBrand === brand ? null : brand);
      setOpen(false);
    } else if (onChange) {
      // Multi-select mode
      const isSelected = selectedBrands.includes(brand);
      if (isSelected) {
        setSelectedBrands(selectedBrands.filter((b) => b !== brand));
      } else {
        setSelectedBrands([...selectedBrands, brand]);
      }
    }
  };

  const applyFilters = () => {
    if (onChange) {
      onChange(selectedBrands);
    }
    setOpen(false);
  };

  // Display text based on mode
  const displayText = () => {
    if (onSelectBrand && selectedBrand) {
      return selectedBrand;
    } else if (onChange && selectedBrands.length > 0) {
      return selectedBrands.join(", ");
    }
    return "Select Brand";
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
                          (onSelectBrand ? selectedBrand === brand : selectedBrands.includes(brand))
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {brand}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onChange && (
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
