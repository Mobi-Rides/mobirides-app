
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { UnauthenticatedView } from "@/components/home/UnauthenticatedView";
import { LoadingView } from "@/components/home/LoadingView";
import { HostView } from "@/components/home/HostView";
import { RenterView } from "@/components/home/RenterView";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "price",
    sortOrder: "asc",
  });
  const location = useLocation();

  const { isAuthenticated, userRole, isLoadingRole } = useAuthStatus();

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  // This effect handles direct URLs with auth parameters
  useEffect(() => {
    // Any initialization based on URL params would go here
    // The actual modal handling is in UnauthenticatedView
  }, [location.search]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
      />
      <main className="container mx-auto px-4 py-8">
        {isLoadingRole ? (
          <LoadingView />
        ) : !isAuthenticated ? (
          <UnauthenticatedView />
        ) : userRole === "host" ? (
          <HostView searchQuery={searchQuery} />
        ) : (
          <RenterView 
            searchQuery={searchQuery} 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
          />
        )}
      </main>
      <Navigation />
    </div>
  );
};

export default Index;
