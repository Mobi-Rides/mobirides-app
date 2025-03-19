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
  CommandTrigger,
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
  brands: string[];
  onChange: (brands: string[]) => void;
}

const BrandFilter: React.FC<BrandFilterProps> = ({ brands, onChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState(brands);

  const handleBrandSelect = (brand: string) => {
    const isSelected = selectedBrands.includes(brand);
    if (isSelected) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const applyFilters = () => {
    onChange(selectedBrands);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedBrands.length > 0
            ? selectedBrands.join(", ")
            : "Select Brand"}
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
                      selectedBrands.includes(brand)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {brand}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={applyFilters}>
                Apply Filters
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BrandFilter;
