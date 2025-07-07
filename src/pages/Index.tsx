import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { GuestView } from "@/components/home/GuestView";
=======
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { UnauthenticatedView } from "@/components/home/UnauthenticatedView";
import { LoadingView } from "@/components/home/LoadingView";
import { HostView } from "@/components/home/HostView";
import { RenterView } from "@/components/home/RenterView";
import type { SearchFilters as Filters } from "@/components/SearchFilters";
import { AuthTriggerService } from "@/services/authTriggerService";
import { trackGuestPageView } from "@/utils/analytics";
=======

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
  const navigate = useNavigate();
=======

  const { isAuthenticated, userRole, isLoadingRole } = useAuthStatus();

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
=======

  // This effect handles direct URLs with auth parameters
  useEffect(() => {
    // Any initialization based on URL params would go here
    // The actual modal handling is in UnauthenticatedView
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated) {
      // Execute any stored post-authentication actions
      AuthTriggerService.executeStoredIntent().then((executed) => {
        if (executed) {
          console.log('Post-authentication action executed successfully');
        }
      });
    }
  }, [isAuthenticated, navigate]);

  // Track guest page view when unauthenticated users visit
  useEffect(() => {
    if (!isAuthenticated && !isLoadingRole) {
      trackGuestPageView('home');
    }
  }, [isAuthenticated, isLoadingRole]);

  if (isLoadingRole) {
    return <LoadingView />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
        />
        <main className="container mx-auto px-4 py-8">
          <GuestView 
            searchQuery={searchQuery}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </main>
        <Navigation />
      </div>
    );
  }

  if (userRole === "host") {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
        />
        <main className="container mx-auto px-4 py-8">
          <HostView searchQuery={searchQuery} />
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
=======

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      <main className="container mx-auto px-4 py-8">
        <RenterView
          searchQuery={searchQuery}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
=======
        {isLoadingRole ? (
          <LoadingView />
        ) : isAuthenticated && userRole === "host" ? (
          <HostView searchQuery={searchQuery} />
        ) : (
          <RenterView 
            searchQuery={searchQuery} 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>
      <Navigation />
    </div>
  );
};

export default Index;
