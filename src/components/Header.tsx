import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SearchFilters } from "./SearchFilters";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: any) => void;
}

export const Header = ({
  searchQuery,
  onSearchChange,
  onFiltersChange,
}: HeaderProps) => {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Find Cars</h1>
          <Link to="/add-car">
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              List Car
            </Button>
          </Link>
        </div>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onFiltersChange={onFiltersChange}
        />
      </div>
    </header>
  );
};