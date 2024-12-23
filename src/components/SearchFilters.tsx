import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, MapPin, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

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
}

export const SearchFilters = ({ onFiltersChange }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc",
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white shadow-sm rounded-lg">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[240px]">
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
        onValueChange={(value) => handleFilterChange("vehicleType", value as VehicleType)}
      >
        <SelectTrigger className="w-[180px]">
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

      <div className="relative flex-1 min-w-[200px]">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Enter pickup location"
          className="w-full pl-10 pr-4 py-2 border rounded-md"
          value={filters.location}
          onChange={(e) => handleFilterChange("location", e.target.value)}
        />
      </div>

      <Select
        value={filters.sortBy}
        onValueChange={(value) => handleFilterChange("sortBy", value)}
      >
        <SelectTrigger className="w-[140px]">
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
  );
};