import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, MapPin, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VehicleType = "Basic" | "Standard" | "Executive" | "4x4" | "SUV" | "Electric" | "Exotic";

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  startDate: Date | undefined;
  endDate: Date | undefined;
  vehicleType: VehicleType | undefined;
  location: string;
  sortBy: "price" | "distance";
  sortOrder: "asc" | "desc";
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
}

export const SearchFilters = ({ onFiltersChange }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc",
    model: undefined,
    year: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white">
      <div className="space-y-4">
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="Search by model..."
            value={filters.model || ""}
            onChange={(e) => handleFilterChange("model", e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            placeholder="Search by year..."
            value={filters.year || ""}
            onChange={(e) => handleFilterChange("year", e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="minPrice">Min Price (BWP)</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="Min price..."
              value={filters.minPrice || ""}
              onChange={(e) => handleFilterChange("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <div>
            <Label htmlFor="maxPrice">Max Price (BWP)</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Max price..."
              value={filters.maxPrice || ""}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate && filters.endDate ? (
              `${format(filters.startDate, "PP")} - ${format(filters.endDate, "PP")}`
            ) : (
              "Select dates"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: filters.startDate,
              to: filters.endDate,
            }}
            onSelect={(range) => {
              handleFilterChange("startDate", range?.from);
              handleFilterChange("endDate", range?.to);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.vehicleType}
        onValueChange={(value) => handleFilterChange("vehicleType", value as VehicleType)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Vehicle type" />
        </SelectTrigger>
        <SelectContent>
          {["Basic", "Standard", "Executive", "4x4", "SUV", "Electric", "Exotic"].map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Enter pickup location"
          className="w-full pl-10 pr-4 py-2 border rounded-md"
          value={filters.location}
          onChange={(e) => handleFilterChange("location", e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Select
          value={filters.sortBy}
          onValueChange={(value) => handleFilterChange("sortBy", value as "price" | "distance")}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className={`h-4 w-4 ${filters.sortOrder === "desc" ? "rotate-180" : ""}`} />
        </Button>
      </div>
    </div>
  );
};