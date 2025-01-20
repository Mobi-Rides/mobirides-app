import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchFilters } from "@/components/SearchFilters";
import { useNavigate } from "react-router-dom";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: Filters) => void;
}

export const Header = ({ searchQuery, onSearchChange, onFiltersChange }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Gaborone, Botswana</h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/add-car")}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-xl">🔔</span>
        </button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SearchFilters onFiltersChange={onFiltersChange} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};